package net.voidhttp.render;

import net.voidhttp.render.transformer.JSXTransformer;
import org.mozilla.javascript.JavaScriptException;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class Compiler {
    private final String target;
    private final boolean generateHtml;

    public Compiler(String target, boolean generateHtml) {
        this.target = target;
        this.generateHtml = generateHtml;
    }

    public void compile() {
        System.out.println("[Void] Using content root " + new File(target).getAbsoluteFile());

        // get the components and the pages folder
        File componentsDir = new File(target, "components");
        File pagesDir = new File(target, "pages");

        // check if the components or the pages folder is missing from the project files
        if (!componentsDir.isDirectory()) {
            System.out.println("Missing components folder from project folder");
            return;
        } else if (!pagesDir.isDirectory()) {
            System.out.println("Missing pages folder from project");
            return;
        }

        // get the output javascript file path
        File projectFolder = new File(target);
        File publicFolder = new File(projectFolder, "public");
        File outputFile = new File(publicFolder, "app.js");
        File targetFolder = new File(projectFolder, "target");

        // read the html generation template if is enabled
        String htmlTemplate = null;
        if (generateHtml) {
            // get the html template file
            File templateFile = new File(target, "template.html");
            // check if the template is missing
            if (!templateFile.isFile()) {
                System.out.println("Missing template.html from project folder");
                return;
            }
            // read the html template
            htmlTemplate = readFile(templateFile);
        }

        System.out.println("[Void] Compiling " + target + " with html generation enabled " + generateHtml);

        // create the JSX to JS transformer
        JSXTransformer transformer = new JSXTransformer();
        // transformer.setModulePaths(Collections.singletonList("https://cdnjs.cloudflare.com/ajax/libs/react/0.14.0-beta3/"));
        transformer.setModulePaths(Collections.singletonList("file:///D:/.dev/GitHub/VoidRenderer/lib/"));
        transformer.setJsxTransformerJS("JSXTransformer.js");
        transformer.init();

        // create the output javascript file writer
        try (OutputStreamWriter writer = new OutputStreamWriter(Files.newOutputStream(outputFile.toPath()), StandardCharsets.UTF_8)) {
            // write the application setup header
            writer.write("let app = new App(document.getElementById('root'));\n");
            writer.write("let page = null;\n");

            // get the component and page files from the project folder
            List<File> components = walk(componentsDir);
            List<File> pages = walk(pagesDir);

            int compiled = 0;

            // handle the component files
            for (File file : components) {
                // skip non-jsx files
                String extension = file.getName().substring(file.getName().lastIndexOf('.'));
                if (!extension.equals(".jsx"))
                    continue;

                // read and compile the component file content
                String content = compile(file, "component", transformer)
                    .replaceAll("[\r\n]+", "\n");

                // append the compiled component to the output
                writer.write(content + '\n');

                // get the name of the component
                String name = file.getName();
                name = name.substring(0, name.lastIndexOf('.'));

                // debug the current compiling status
                System.out.println("Compiled component " + name + " [" + ++compiled + '/' + components.size() + ']');
            }

            compiled = 0;
            // handle page files
            for (File file : pages) {
                // skip non-jsx files
                String extension = file.getName().substring(file.getName().lastIndexOf('.'));
                if (!extension.equals(".jsx"))
                    continue;

                // read and compile the page file content
                String content = compile(file, "page", transformer)
                    .replaceAll("[\r\n]+", "\n");
                // get the name of the page
                String name = file.getName();
                name = name.substring(0, name.lastIndexOf('.'));

                // write the page content registration
                writer.write(content + '\n');
                String register = "app.register('$name', page);"
                    .replace("$name", name);
                writer.write(register + '\n');

                // debug the current compiling status
                System.out.println("Compiled page " + name + " [" + ++compiled + '/' + pages.size() + ']');

                // generate a html page for the page if it is enabled
                if (generateHtml) {
                    // get the file of the html page
                    File pageFile = new File(targetFolder, name + ".html");
                    // do not regenerate html if it already exists
                    if (pageFile.isFile())
                        continue;

                    // fill in the html generation template
                    String template = htmlTemplate
                        .replace("$title", name.substring(0, 1).toUpperCase() + name.substring(1))
                        .replace("$page", name)
                        .replace("$file", outputFile.getName().substring(0, outputFile.getName().length() - 3));
                    // write the template to the page html file
                    writeFile(pageFile, template);

                    System.out.println("Created page " + name);
                }
            }

        } catch (IOException e) {
            System.out.println("Unable to write to output file");
            e.printStackTrace();
        }
    }

    private String compile(File file, String type, JSXTransformer transformer) {
        try {
            // try to compile the raw JSX source to JS output
            return transformer.transform(readFile(file));
        } catch (JavaScriptException e) {
            // handle syntax error in the JSX file
            System.out.println("Syntax error in " + type + " source file '" + file + "'");
            e.printStackTrace();
            System.exit(0);
        }
        throw new IllegalStateException("This should never happen");
    }

    private String readFile(File file) {
        try (BufferedReader reader = Files.newBufferedReader(file.toPath(), StandardCharsets.UTF_8)) {
            // read the project file line by line
            StringBuilder builder = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null)
                builder.append(line).append('\n');
            return builder.toString();
        } catch (IOException e) {
            System.out.println("Unable to read file " + file);
            e.printStackTrace();
            System.exit(0);
        }
        throw new IllegalStateException("This should never happen");
    }

    private void writeFile(File file, String content) {
        try (FileWriter writer = new FileWriter(file, StandardCharsets.UTF_8)) {
            writer.write(content);
        } catch (IOException e) {
            System.out.println("Unable to write file " + file);
            e.printStackTrace();
            System.exit(0);
        }
    }

    private List<File> walk(File directory) {
        List<File> result = new ArrayList<>();
        walk(directory, result);
        return result;
    }

    private void walk(File directory, List<File> result) {
        File[] files = directory.listFiles();
        if (files == null)
            return;
        List<File> dirs = new ArrayList<>();
        for (File file : files) {
            if (file.isFile())
                result.add(file);
            else
                dirs.add(file);
        }
        for (File dir : dirs)
            walk(dir, result);
    }
}

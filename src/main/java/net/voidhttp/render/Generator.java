package net.voidhttp.render;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Paths;

public class Generator {
    private final String name;

    public Generator(String name) {
        this.name = name;
    }

    public void generate() {
        // validate that the project name is set
        if (name.isEmpty()) {
            System.out.println("Invalid project name");
            return;
        }

        // get the current working directory
        File workingDir = Paths.get(".").toFile();
        File projectDir = new File(workingDir, name);
        File targetDir = new File(projectDir, "target");

        // check if the given path already exists
        if (projectDir.exists()) {
            System.out.println("Project folder already exits");
            return;
        }

        // create the project folder
        if (!projectDir.mkdirs()) {
            System.out.println("Unable to create project folder");
            return;
        }

        // create the html target folder
        if (!targetDir.mkdirs()) {
            System.out.println("Unable to create output folder");
            return;
        }

        // create the template html file
        copyResource("template.html", projectDir);
        // create the demo index html file
        copyResource("index.html", targetDir);

        // create the components folder
        File components = new File(projectDir, "components");
        if (!components.mkdirs()) {
            System.out.println("Unable to create components folder");
            return;
        }

        // create the demo component
        copyResource("demo.jsx", components);

        // create the pages folder
        File pages = new File(projectDir, "pages");
        if (!pages.mkdirs()) {
            System.out.println("Unable to create pages folder");
            return;
        }

        // create the index jsx page
        copyResource("index.jsx", pages);

        // create the public assets folder
        File publicFolder = new File(projectDir, "public");
        if (!publicFolder.mkdirs()) {
            System.out.println("Unable to create public assets folder");
            return;
        }

        // create the default css file
        copyResource("default.css", publicFolder);

        // create the framework js file
        copyResource("void.js", publicFolder);

        // create the compiled application js file
        copyResource("app.js", publicFolder);

        // create the favicon file
        copyResource("favicon.png", publicFolder);

        // create the style css file
        copyResource("style.css", publicFolder);

        System.out.println("Created new void project '" + name + "'");
    }

    private void copyResource(String resource, File directory) {
        File file = new File(directory, resource);
        try (InputStream streamIn = getClass().getClassLoader().getResourceAsStream(resource);
             OutputStream streamOut = Files.newOutputStream(file.toPath())) {
            if (streamIn == null) {
                System.out.println("Missing resource " + resource);
                System.exit(0);
            }
            byte[] buffer = new byte[8 * 2024];
            int read;
            while ((read = streamIn.read(buffer)) != -1) {
                streamOut.write(buffer, 0, read);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}

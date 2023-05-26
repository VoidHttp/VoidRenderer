package net.voidhttp.render;

import net.voidhttp.optionparser.*;

public class Main {
    public static void main(String[] args) {
        OptionParser parser = new OptionParser();

        Option compile = new OptionBuilder()
            .setName("compile")
            .setType(OptionType.TEXT)
            .setAliases("-c", "--compile")
            .setHelp("compile a void project")
            .build();

        Option generateHtml = new OptionBuilder()
            .setName("generate html")
            .setType(OptionType.TEXT)
            .setAliases("-g", "--generate-html")
            .setHelp("enable html generation for pages")
            .build();

        OptionGroup compileGroup = new OptionGroup(compile);
        compileGroup.addOption(generateHtml);

        parser.addOptionGroup(compileGroup);

        Option newProject = new OptionBuilder()
            .setName("new project")
            .setType(OptionType.TEXT)
            .setAliases("-n", "--new")
            .setHelp("create a new void project")
            .build();

        parser.addOption(newProject);

        parser.parse(args);

        if (compile.isPresent())
            new Compiler(compile.stringValue(), generateHtml.isPresent()).compile();

        if (newProject.isPresent())
            new Generator(newProject.stringValue()).generate();

    }
}

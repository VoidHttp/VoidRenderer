package net.voidhttp.render.transformer;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.NativeObject;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.commonjs.module.Require;
import org.mozilla.javascript.commonjs.module.RequireBuilder;
import org.mozilla.javascript.commonjs.module.provider.SoftCachingModuleScriptProvider;
import org.mozilla.javascript.commonjs.module.provider.UrlModuleSourceProvider;

import java.io.File;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.List;

public class JSXTransformer {
    private List<String> modulePaths;
    private String jsxTransformerJS;
    private Context ctx;
    private Scriptable exports;
    private Scriptable topLevelScope;
    private Function transform;

    public void setModulePaths(List<String> modulePaths) {
        this.modulePaths = modulePaths;
    }

    public void setJsxTransformerJS(String jsxTransformerJS) {
        this.jsxTransformerJS = jsxTransformerJS;
    }

    public void init() {
        ctx = Context.enter();
        try {
            RequireBuilder builder = new RequireBuilder();
            builder.setModuleScriptProvider(new SoftCachingModuleScriptProvider(
                new UrlModuleSourceProvider(buildModulePaths(), null)
            ));

            topLevelScope = ctx.initStandardObjects();
            Require require = builder.createRequire(ctx, topLevelScope);

            exports = require.requireMain(ctx, jsxTransformerJS);
            transform = (Function) exports.get("transform", topLevelScope);
        } catch (URISyntaxException e) {
            e.printStackTrace();
        } finally {
            Context.exit();
        }
    }

    // mostly copied from org.mozilla.javascript.tools.shell.Global.installRequire()
    private List<URI> buildModulePaths() throws URISyntaxException {
        List<URI> uris = new ArrayList<URI>(modulePaths.size());
        for (String path : modulePaths) {
            try {
                URI uri = new URI(path);
                if (!uri.isAbsolute()) {
                    // call resolve("") to canonify the path
                    uri = new File(path).toURI().resolve("");
                }
                if (!uri.toString().endsWith("/")) {
                    // make sure URI always terminates with slash to
                    // avoid loading from unintended locations
                    uri = new URI(uri + "/");
                }
                uris.add(uri);
            } catch (URISyntaxException usx) {
                throw new RuntimeException(usx);
            }
        }
        return uris;
    }

    public String transform(String jsx) {
        Context.enter();
        try {
            NativeObject result = (NativeObject) transform.call(ctx, topLevelScope, exports, new String[] { jsx });
            return result.get("code").toString();
        } finally {
            Context.exit();
        }
    }
}

package org.openstreetmap.josm.plugins.scripting.python;

import java.lang.reflect.InvocationTargetException;
import java.util.logging.Level;
import java.util.logging.Logger;

import static org.openstreetmap.josm.tools.I18n.tr;

/**
 * Dynamically loads and instantiates a {@link IPythonPluginManager},
 * provided the Jython interpreter is on the class path.
 *
 * @deprecated Starting with plugin version 0.2.0 Jython plugins
 * are not supported anymore.
 */
@SuppressWarnings("removal")
@Deprecated(forRemoval = true, since = "0.2.0")
public class PythonPluginManagerFactory {

    static final private Logger logger = Logger.getLogger(
            PythonPluginManagerFactory.class.getName());

    /**
     * Creates and replies an instance of the python plugin manager, or
     * null, if either the python interpreter is not on the class path
     * or dynamically loading {@link PythonPluginManager} fails.
     *
     * @return the python plugin manager or null
     */
    static public IPythonPluginManager createPythonPluginManager() {
        if (!isJythonPresent()) {
            logger.warning(tr("Jython interpreter isn''t on the class path. "
                 + "Support for Python plugins is disabled."));
            return null;
        }
        try {
            Class<?> mgrClass = Class.forName(
                 "org.openstreetmap.josm.plugins.scripting.python"
               + ".PythonPluginManager"
            );
            final IPythonPluginManager mgr =
               (IPythonPluginManager) mgrClass.getDeclaredConstructor()
                       .newInstance();
            logger.info("Enabled support for Python plugins.");
            return mgr;
        } catch(
            ClassNotFoundException | InstantiationException
            | IllegalAccessException | NoClassDefFoundError
            | NoSuchMethodException | InvocationTargetException e
        ) {
            logger.log(Level.SEVERE, e.getMessage(), e);
            return null;
        }
    }

    /**
     * Replies true, if the Jython Interpreter is on the class path
     *
     * @return true, if the Jython Interpreter is on the class path
     */
    static public boolean isJythonPresent() {
        try {
            Class.forName("org.python.util.PythonInterpreter");
            return true;
        } catch(ClassNotFoundException e) {
            return false;
        }
    }
}

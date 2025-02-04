package org.openstreetmap.josm.plugins.scripting.model;

import org.openstreetmap.josm.data.Preferences;
import org.openstreetmap.josm.plugins.scripting.graalvm.GraalVMFacadeFactory;

import javax.script.ScriptEngineFactory;
import javax.validation.constraints.NotNull;
import java.text.MessageFormat;
import java.util.*;
import java.util.logging.Level;
import java.util.logging.Logger;

import static org.openstreetmap.josm.tools.I18n.tr;

/**
 * Describes a scripting engine used in the scripting plugin.
 *
 */
public class ScriptEngineDescriptor implements PreferenceKeys {
    static private final Logger logger =
            Logger.getLogger(ScriptEngineDescriptor.class.getName());

    public enum ScriptEngineType {
        /**
         * an embedded scripting engine, i.e. the embedded Mozilla Rhino engine
         */
        EMBEDDED("embedded"),
        /**
         * a scripting engine supplied as JSR233 compliant scripting engine
         */
        PLUGGED("plugged"),

        /**
         * a scripting engine/language supported by the GraalVM
         */
        GRAALVM("graalvm")
        ;

        public final String preferencesValue;
        ScriptEngineType(String preferencesValue) {
            this.preferencesValue = preferencesValue;
        }

        /**
         * <p>Infers the script engine type from preference value. The value is
         * a string <code>type/engineId</code>. This methods decodes the
         * component <code>type</code>. Replies <code>null</code> if no type
         * can be inferred.</p>
         *
         * <strong>Examples</strong>
         * <pre>
         *    type = ScriptEngineType.fromPreferencesValue("embedded/rhino");
         *    type = ScriptEngineType.fromPreferencesValue("plugged/groovy");
         *    type = ScriptEngineType.fromPreferencesValue("graalvm/js");
         * </pre>
         *
         * @param preferencesValue the preferences value
         * @return the type
         */
        static public ScriptEngineType fromPreferencesValue(
                String preferencesValue) {
            if (preferencesValue == null) return null;
            preferencesValue = preferencesValue.trim().toLowerCase();
            final int i = preferencesValue.indexOf("/");
            final String pv = i < 0
                ? preferencesValue
                : preferencesValue.substring(0, i);
            return Arrays.stream(values())
                .filter(e -> e.preferencesValue.equals(pv))
                .findFirst()
                .orElse(null);
        }
    }

    private final ScriptEngineType engineType;
    private final String engineId;
    private String languageName = null;
    private String languageVersion = null;
    private String engineName = null;
    private String engineVersion = null;
    private final HashSet<String> contentMimeTypes = new HashSet<>();

    /**
     * The default script engine descriptor. Refers to the embedded script
     * engine based on Mozilla Rhino.
     */
    static public final ScriptEngineDescriptor DEFAULT_SCRIPT_ENGINE =
        new ScriptEngineDescriptor(
            ScriptEngineType.EMBEDDED,  // engineType
            "rhino",                    // engineId
            "Mozilla Rhino",            // engineName
            "JavaScript",               // languageName
            "text/javascript"           // contentType
        );

    /**
     * An unmodifiable map of embedded script engines (currently only one entry
     * for the embedded engine based on Mozilla Rhino)
     */
    static public final Map<String, ScriptEngineDescriptor> EMBEDDED_SCRIPT_ENGINES = Map.of(
            DEFAULT_SCRIPT_ENGINE.getEngineId(),
            DEFAULT_SCRIPT_ENGINE);

    /**
     * <p>Replies a script engine descriptor derived from a preference value
     * <code>engineType/engineId</code> in {@link Preferences#main()}.<p>
     *
     * @return the scripting engine descriptor
     * @see #buildFromPreferences(Preferences)
     */
    @SuppressWarnings("unused")
    static public ScriptEngineDescriptor buildFromPreferences(){
        return buildFromPreferences(Preferences.main());
    }

    /**
     * <p>Replies a script engine descriptor derived from a preference value
     * <code>engineType/engineId</code>.<p>
     *
     * <p>Looks for  the preference value with key
     * {@link PreferenceKeys#PREF_KEY_SCRIPTING_ENGINE}.
     * If this key doesn't exist or if it doesn't refer to a supported
     * combination of <code>engineType</code> and <code>engineId</code>, the
     * default scripting engine descriptor {@link #DEFAULT_SCRIPT_ENGINE} is
     * replied.</p>
     *
     * @param preferences the preferences
     * @return the scripting engine descriptor
     */
    static public ScriptEngineDescriptor buildFromPreferences(
            final Preferences preferences) {
        if (preferences == null) return DEFAULT_SCRIPT_ENGINE;
        String prefValue = preferences.get(PREF_KEY_SCRIPTING_ENGINE);
        return buildFromPreferences(prefValue);
    }

    /**
     * <p>Replies a script engine descriptor derived from a preference value
     * <code>engineType/engineId</code>.<p>
     *
     * @param preferenceValue the preference value. If null, replies the
     *      {@link #DEFAULT_SCRIPT_ENGINE}
     *
     * @return the scripting engine descriptor
     */
    static public ScriptEngineDescriptor buildFromPreferences(
            final String preferenceValue){
        if (preferenceValue == null) return DEFAULT_SCRIPT_ENGINE;

        final ScriptEngineType type =
            ScriptEngineType.fromPreferencesValue(preferenceValue);
        if (type == null) {
            //NOTE: might be a legal preferences value for former plugin
            // versions. No attempt to recover from these values, when this
            // code goes productive, former preference values are automatically
            // reset to the current default scripting engine.
            logger.warning(tr("preference with key ''{0}'' "
                + "consist of an unsupported value. Expected pattern "
                + "''type/id'', got ''{1}''. Assuming default scripting engine.",
                PREF_KEY_SCRIPTING_ENGINE, preferenceValue));
            return DEFAULT_SCRIPT_ENGINE;
        }

        final int i = preferenceValue.indexOf("/");
        if (i < 0) return DEFAULT_SCRIPT_ENGINE;
        String engineId = preferenceValue.substring(i+1);
        switch(type){
            case EMBEDDED:
                engineId = engineId.trim().toLowerCase();
                final ScriptEngineDescriptor desc =
                    EMBEDDED_SCRIPT_ENGINES.get(engineId);
                if (desc == null) {
                    logger.warning(tr("preference with key ''{0}'' "
                        + "refers to an unsupported embedded scripting "
                        + "engine with id ''{1}''. "
                        + "Assuming default scripting engine.",
                        PREF_KEY_SCRIPTING_ENGINE, engineId));
                    return DEFAULT_SCRIPT_ENGINE;
                }
                return desc;

            case PLUGGED:
                // don't lowercase. Lookup in ScriptEngineManager could be
                // case-sensitive
                engineId = engineId.trim();
                logger.log(Level.FINE, MessageFormat.format(
                    "buildFromPreferences: engineId={1}",
                    engineId));
                if (!JSR223ScriptEngineProvider.getInstance()
                        .hasEngineWithName(engineId)) {
                    logger.warning(tr("preference with key ''{0}''"
                        + " refers to an unsupported JSR223 compatible "
                        + " scripting engine with id ''{1}''. "
                        + " Assuming default scripting engine.",
                        PREF_KEY_SCRIPTING_ENGINE,
                        engineId));
                    return DEFAULT_SCRIPT_ENGINE;
                }
                return new ScriptEngineDescriptor(ScriptEngineType.PLUGGED, engineId);

            case GRAALVM:
                if (!GraalVMFacadeFactory.isGraalVMPresent()) {
                    logger.warning(tr("preferences with key ''{0}'' refers to an "
                        + "GraalVM engine, but currently the GraalVM isn''t present "
                        + "on the classpath. Assuming default scripting engine.",
                        PREF_KEY_SCRIPTING_ENGINE
                    ));
                    return DEFAULT_SCRIPT_ENGINE;
                }
                final String id = engineId;
                final var engine = GraalVMFacadeFactory.getOrCreateGraalVMFacade()
                    .getScriptEngineDescriptors().stream().filter(d ->
                        d.getEngineId().equalsIgnoreCase(id)
                    )
                    .findFirst();
                if (engine.isEmpty()) {
                    logger.warning(tr("preference with key ''{0}'' refers to an GraalVM engine "
                        + "with id''{1}''. The GraalVM for this language is currently not "
                        + "present. Assuming default scripting engine.",
                        PREF_KEY_SCRIPTING_ENGINE,
                        id
                    ));
                    return DEFAULT_SCRIPT_ENGINE;
                } else {
                    return engine.get();
                }

            default:
                // shouldn't happen
                throw new IllegalStateException(String.format(
                    "unexpected scripting engine type '%s'", type
                ));
        }
    }

    protected void initParametersForJSR223Engine(String engineId) {
        ScriptEngineFactory factory = JSR223ScriptEngineProvider.getInstance()
                .getScriptFactoryByName(engineId);
        initParametersForJSR223Engine(factory);
    }

    protected void initParametersForJSR223Engine(ScriptEngineFactory factory) {
        if (factory == null){
            this.languageName = null;
            this.languageVersion = null;
            this.engineName = null;
            this.contentMimeTypes.clear();
            this.engineVersion = null;
        } else {
            this.languageName = factory.getLanguageName();
            this.languageVersion = factory.getLanguageVersion();
            this.engineName = factory.getEngineName();
            this.contentMimeTypes.clear();
            this.contentMimeTypes.addAll(factory.getMimeTypes());
            this.engineVersion = factory.getEngineVersion();
        }
    }

    /**
     * Creates a new descriptor for the type {@link ScriptEngineType#PLUGGED}.
     *
     * @param engineId the engine id. Must not be null.
     */
    public ScriptEngineDescriptor(@NotNull String engineId){
        Objects.requireNonNull(engineId);
        this.engineType = ScriptEngineType.PLUGGED;
        this.engineId = engineId.trim();
        initParametersForJSR223Engine(this.engineId);
    }

    /**
     * Creates a new descriptor.
     *
     * @param engineType the engine type. Must not be null.
     * @param engineId the engine id. Must not be null.
     */
    public ScriptEngineDescriptor(@NotNull ScriptEngineType engineType,
            @NotNull String engineId) {
        Objects.requireNonNull(engineType);
        Objects.requireNonNull(engineId);
        this.engineId = engineId;
        this.engineType= engineType;
        if (this.engineType.equals(ScriptEngineType.PLUGGED)) {
            initParametersForJSR223Engine(this.engineId);
        }
    }

    /**
     * Creates a new descriptor.
     *
     * @param engineType the engine type. Must not be null.
     * @param engineId the engine id. Must not be null.
     * @param languageName the name of the scripting language. May be null.
     * @param engineName the name of the scripting engine. May be null.
     * @param contentType the content type of the script sources. Ignored
     *   if null.
     */
    public ScriptEngineDescriptor(
            @NotNull ScriptEngineType engineType,
            @NotNull String engineId,
            String engineName, String languageName,  String contentType) {
        this(engineType, engineId, engineName, languageName, contentType,
                null /* engineVersion */,
                null /* languageVersion */);
    }

    /**
     * Creates a new descriptor.
     *
     * @param engineType the engine type. Must not be null.
     * @param engineId the engine id. Must not be null.
     * @param languageName the name of the scripting language. May be null.
     * @param engineName the name of the scripting engine. May be null.
     * @param contentType the content type of the script sources. Ignored
     *   if null.
     * @param engineVersion the version of the engine
     * @param languageVersion the version the language
     */
    public ScriptEngineDescriptor(
            @NotNull ScriptEngineType engineType,
            @NotNull String engineId,
            String engineName, String languageName, String contentType,
            String engineVersion, String languageVersion) {
        Objects.requireNonNull(engineType);
        Objects.requireNonNull(engineId);
        this.engineId = engineId;
        this.engineType= engineType;
        this.languageName = languageName == null ? null : languageName.trim();
        this.engineName = engineName == null ? null : engineName.trim();
        if (contentType != null) {
            this.contentMimeTypes.add(contentType.trim());
        }
        this.engineVersion = engineVersion;
        this.languageVersion = languageVersion;
    }
    /**
     * Creates a new descriptor given a factory for JSR223-compatible script
     * engines.
     *
     * @param factory the factory. Must not be null.
     */
    public ScriptEngineDescriptor(@NotNull final ScriptEngineFactory factory) {
        Objects.requireNonNull(factory);
        this.engineType = ScriptEngineType.PLUGGED;
        final var engineNames = factory.getNames();
        if (engineNames == null || engineNames.isEmpty()) {
            logger.warning(MessageFormat.format("script engine factory ''{0}''"
                + " doesn''t provide engine names. Using engine factory name ''{0}'' instead.",
                factory.getEngineName()));
            this.engineId = factory.getEngineName();
            this.engineName = factory.getEngineName();
        } else {
            // use the first of the provided names as ID and engine name
            this.engineId = engineNames.get(0);
            if (factory.getEngineName() != null) {
                this.engineName = factory.getEngineName();
            } else {
                this.engineName = engineNames.get(0);
            }
        }
        initParametersForJSR223Engine(factory);
    }

    /**
     * Replies true, if this is the descriptor for the default scripting engine.
     * @return true, if this is the descriptor for the default scripting engine.
     */
    public boolean isDefault() {
        return this.equals(DEFAULT_SCRIPT_ENGINE);
    }

    /**
     * Replies the engine id
     *
     * @return the engine id
     */
    public String getEngineId() {
        return engineId;
    }

    /**
     * Replies the engine type
     *
     * @return engine type
     */
    public ScriptEngineType getEngineType() {
        return engineType;
    }

    /**
     * Replies a string representing the descriptor in the format
     * <em>engineType/engineInfo</em>.
     *
     * @return the preferences value
     * @see #buildFromPreferences()
     */
    public String getPreferencesValue() {
        return MessageFormat.format("{0}/{1}", engineType.preferencesValue,
                engineId);
    }

    /**
     * Replies the name of the scripting language supported by this scripting
     * engine, if it is known.
     *
     * @return the name of the scripting language supported by this scripting
     *  engine.
     */
    public Optional<String> getLanguageName() {
        return Optional.ofNullable(languageName);
    }

    /**
     * Replies the name of the scripting engine, if it is known.
     *
     * @return the name of the scripting engine
     */
    public Optional<String> getEngineName() {
        return Optional.ofNullable(engineName);
    }

    /**
     * Replies the version of the scripting engine, if it is known.
     *
     * @return the version of the scripting engine
     */
    public Optional<String> getEngineVersion() {
        return Optional.ofNullable(engineVersion);
    }

    /**
     * Replies the language version, if it is known.
     *
     * @return the language version
     */
    public Optional<String> getLanguageVersion() {
        return Optional.ofNullable(languageVersion);
    }

    /**
     * Replies the content types of the script source
     *
     * @return the content types. An unmodifiable list. An empty list, if no
     *  content types are known.
     */
    public Set<String> getContentMimeTypes() {
        return Collections.unmodifiableSet(contentMimeTypes);
    }

    /**
     * Sets the content mime types of the script source
     *
     * @param mimeTypes the content mime types
     */
    public void setContentMimeTypes(@NotNull Collection<String> mimeTypes) {
        this.contentMimeTypes.clear();
        this.contentMimeTypes.addAll(mimeTypes);
    }

    public String toString() {
        return getPreferencesValue();
    }

    @Override
    public int hashCode() {
        final int prime = 31;
        int result = 1;
        result = prime * result
                + ((engineId == null) ? 0 : engineId.hashCode());
        result = prime * result
                + ((engineType == null) ? 0 : engineType.hashCode());
        return result;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj)
            return true;
        if (obj == null)
            return false;
        if (getClass() != obj.getClass())
            return false;
        ScriptEngineDescriptor other = (ScriptEngineDescriptor) obj;
        if (engineId == null) {
            if (other.engineId != null)
                return false;
        } else if (!engineId.equals(other.engineId))
            return false;
        return engineType == other.engineType;
    }

    /**
     * Replies true if this descriptor describes the embedded Mozilla Rhino
     * scripting engine
     *
     * @return true if this descriptor describes the embedded Mozilla Rhino
     *   scripting engine; false otherwise
     */
    public boolean isDescribingMozillaRhino() {
        return this.engineType.equals(ScriptEngineType.EMBEDDED);
    }

    /**
     * Replies true if this descriptor describes the GraalJS engine.
     *
     * @return true if this descriptor describes the GraalJS engine; false,
     * otherwise
     */
    public boolean isDescribingGraalJS() {
        return this.engineType.equals(ScriptEngineType.GRAALVM)
                && "js".equals(this.engineId);
    }
}

package org.openstreetmap.josm.plugins.scripting.graalvm.commonjs;

import org.openstreetmap.josm.plugins.scripting.graalvm.ModuleID;
import org.openstreetmap.josm.plugins.scripting.graalvm.ModuleJarURI;
import org.openstreetmap.josm.plugins.scripting.graalvm.commonjs.BaseJSModuleRepository;

import javax.validation.constraints.NotNull;
import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URI;
import java.net.URISyntaxException;
import java.text.MessageFormat;
import java.util.Objects;
import java.util.Optional;
import java.util.jar.JarEntry;
import java.util.jar.JarFile;
import java.util.logging.Level;

/**
 * A collection of common JS modules packaged into a jar file.
 */
public class JarJSModuleRepository extends BaseJSModuleRepository {
    private void ensureReadableJarFile() throws IOException {
        if (! (jarUri.refersToReadableFile() && jarUri.refersToJarFile())) {
            throw new IOException(MessageFormat.format(
                "jar file doesn''t exist, isn''t a jar file, or can''t " +
                "be read. file=''{0}''",
                jarUri.getJarFilePath()
            ));
        }
    }

    static private JarEntry lookupJarEntry(final File jar, final String entryKey)
        throws IOException {
        try(final JarFile jarFile = new JarFile(jar)) {
            final JarEntry entry = jarFile.getJarEntry(entryKey);
            if (entry == null) {
                throw new IOException(MessageFormat.format(
                    "jar entry in jar file doesn''t exist. " +
                    "file=''{0}'', entry key=''{1}''",
                    jar.getAbsolutePath(), entryKey
                ));
            }
            return entry;
        } catch(IOException | SecurityException e) {
            throw new IOException(MessageFormat.format(
                "jar entry in jar file doesn''t exist. " +
                "file=''{0}'', entry key=''{1}''",
                jar.getAbsolutePath(), entryKey
            ), e);
        }
    }

    static private void ensureJarEntryIsDirectory(final File jar,
                                                  final String entryName)
        throws IOException {
        final JarEntry entry = lookupJarEntry(jar, entryName);
        if (!entry.isDirectory()) {
            throw new IOException(MessageFormat.format(
                "jar entry name doesn''t refer to a directory entry in the " +
                "jar file. file=''{0}'', entry name=''{1}''",
                jar.getAbsolutePath(), entryName
            ));
        }
    }

    static private void ensureJarEntryIsFile(final File jar,
                                                  final String entryName)
            throws IOException {
        final JarEntry entry = lookupJarEntry(jar, entryName);
        if (entry.isDirectory()) {
            throw new IOException(MessageFormat.format(
                "jar entry name doesn''t refer to a file entry in the " +
                "jar file. file=''{0}'', entry name=''{1}''",
                jar.getAbsolutePath(), entryName
            ));
        }
    }

    /**
     * {@inheritDoc}
     */
    @Override
    protected boolean isRepoFile(@NotNull String repoPath) {
        if (repoPath == null || repoPath.trim().isEmpty()) {
            return false;
        }
        repoPath = repoPath.trim();
        if (!repoPath.startsWith("/")) {
            logFine(() -> MessageFormat.format(
                "unexpected repo path, doesn''t start with ''/''. " +
                "repoPath=''{0}''",
                jarUri.getJarFilePath()
            ));
            return false;
        }
        final String jarEntryName = repoPath.substring(1);
        if (jarEntryName.isEmpty()) {
            logFine(() -> MessageFormat.format(
                "unexpected empty jar entry name",
                jarEntryName
            ));
            return false;
        }
        try {
            ensureJarEntryIsFile(jarUri.getJarFile(), jarEntryName);
        } catch(IOException e) {
            if (getLogger().isLoggable(Level.FINE)) {
                getLogger().log(Level.FINE, MessageFormat.format(
                    "jar entry isn''t doesn''t exist or isn''t a file entry. " +
                    "jar file=''{0}'', entry name=''{1}''",
                    jarUri.getJarFilePath(), jarEntryName
               ),e);
            }
            return false;
        }
        return true;
    }

    private final ModuleJarURI jarUri;

    /**
     * Creates the repository for a given jar file.
     *
     * @param jar the jar file
     * @throws IOException thrown, if <code>jar</code> isn't an existing and
     * readable jar file
     */
    public JarJSModuleRepository(@NotNull final File jar) throws IOException {
        Objects.requireNonNull(jar);
        final URI jarUri;
        try {
            jarUri = ModuleJarURI.buildJarUri(
                jar.getAbsoluteFile().toString());
        } catch(MalformedURLException | URISyntaxException e) {
            throw new IllegalArgumentException(MessageFormat.format(
                "failed to build jar URI given file. jar file path=''{0}''",
                jar.toString()
            ),e);
        }
        this.jarUri = new ModuleJarURI(jarUri);
        ensureReadableJarFile();
    }

    /**
     * Creates the repository for a given jar file and a path in the
     * jar file
     *
     * @param jar the jar file
     * @param rootPath the path in the jar file
     * @throws IllegalArgumentException thrown, if path doesn't start with
     * a leading /
     * @throws IOException thrown, if <code>jar</code> isn't an existing and
     * readable jar file
     * @throws IOException thrown, if there is no directory <code>rootPath</code>
     * in the jar file <code>jar</code>
     */
    public JarJSModuleRepository(@NotNull final File jar,
                          @NotNull final String rootPath) throws IOException {
        Objects.requireNonNull(jar);
        Objects.requireNonNull(rootPath);
        final URI uri;
        try {
            uri = ModuleJarURI.buildJarUri(
                jar.getAbsoluteFile().toString(), rootPath);
        } catch(MalformedURLException | URISyntaxException e) {
            throw new IllegalArgumentException(MessageFormat.format(
                "failed to build jar URI. " +
                "jar file path=''{0}'', jar entry path=''{1}''",
                jar.toString(), rootPath
            ));
        }
        jarUri = new ModuleJarURI(uri);
        ensureReadableJarFile();
        if (!jarUri.getJarEntryName().isEmpty()) {
            ensureJarEntryIsDirectory(
                jarUri.getJarFile(), jarUri.getJarEntryName());
        }
    }

    /**
     * Creates the repository for a given jar URI.
     *
     * @param uri the jar URI
     * @throws IllegalArgumentException thrown, if <code>uri</code> isn't a
     * jar URI
     * @throws IllegalArgumentException thrown, if <code>uri</code> isn't a
     * <em>valid</em> CommonJS module URI
     * @throws IOException thrown, if <code>uri</code> doesn't refer to
     * an existing and readable jar file
     * @throws IOException thrown, if <code>uri</code> doesn't refer to an
     * existing and readable directory entry in the jar file
     */
    public JarJSModuleRepository(@NotNull final URI uri) throws IOException {
        Objects.requireNonNull(uri);
        // throws IllegalArgumentException, if uri isn't valid
        jarUri = new ModuleJarURI(uri);
        ensureReadableJarFile();
        if (!jarUri.getJarEntryName().isEmpty()) {
            ensureJarEntryIsDirectory(
                jarUri.getJarFile(), jarUri.getJarEntryName());
        }
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public URI getBaseURI() {
        return jarUri.toURI();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public boolean isBaseOf(@NotNull final URI moduleUri) {
        Objects.requireNonNull(moduleUri);
        final ModuleJarURI other;
        try {
            // throws IllegalArgumentException, if moduleUri isn't valid
            other = new ModuleJarURI(moduleUri);
        } catch(IllegalArgumentException e) {
            getLogger().log(Level.WARNING, MessageFormat.format(
                "moduleUri isn''t a valid jar URI for a CommonJS module. " +
                "moduleUri=''{0}''", moduleUri.toString()),
            e);
            return false;
        }
        return this.jarUri.isBaseOf(other);
    }

    private void logInvalidModuleID(String id, IllegalArgumentException e) {
        if (getLogger().isLoggable(Level.FINE)) {
            getLogger().log(Level.FINE, MessageFormat.format(
                "can''t resolve invalid module id. id=''{0}''", id
            ), e);
        }
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Optional<URI> resolve(@NotNull final String id) {
        Objects.requireNonNull(id);
        try {
            ModuleID.ensureValid(id);
        } catch(IllegalArgumentException e) {
            logInvalidModuleID(id, e);
            return Optional.empty();
        }
        return resolveInternal(
            new ModuleID(id).normalized(),
            jarUri.toURI());
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Optional<URI> resolve(@NotNull final String id,
                                 @NotNull final URI contextUri) {
        Objects.requireNonNull(id);
        Objects.requireNonNull(contextUri);
        try {
            ModuleID.ensureValid(id);
        } catch (IllegalArgumentException e) {
            logInvalidModuleID(id, e);
            return Optional.empty();
        }
        ModuleJarURI contextModuleUri;
        try {
            contextModuleUri = new ModuleJarURI(contextUri);
        } catch (IllegalArgumentException e) {
            getLogger().log(Level.FINE, MessageFormat.format(
                "failed to resolve module id, context URI is invalid." +
                "id=''{0}'', contextUri=''{1}''",
                id, contextUri.toString()
            ));
            return Optional.empty();
        }
        try {
            contextModuleUri = contextModuleUri
                .normalized()
                .toResolutionContextUri();
        } catch(IOException e) {
            if (getLogger().isLoggable(Level.FINE)) {
                getLogger().log(Level.FINE, MessageFormat.format(
                    "failed to derive resolution context URI. " +
                    "contextUri=''{0}''",
                    contextUri.toString()
                ),e);
            }
            return Optional.empty();
        }

        if (!jarUri.isBaseOf(contextModuleUri)) {
            final ModuleJarURI _contextModuleUri = contextModuleUri;
            logFine(() -> MessageFormat.format(
                "failed to resolve module id, normalized context URI isn''t " +
                "child of base URI. id=''{0}'', contextUri=''{1}'', " +
                "contextModuleUri=''{2}'', baseUri=''{3}''",
                id, contextUri.toString(),_contextModuleUri.toString(),
                getBaseURI().toString()
            ));
            return Optional.empty();
        }
        return resolveInternal(
                new ModuleID(id).normalized(),
                contextModuleUri.toURI());
    }

    private Optional<URI> resolveInternal(final ModuleID id,
                                            final URI contextUri) {
        //pre: id not null and valid
        //pre: contextUri is not null and a valid CommonJS module jar URI
        //pre: this base URI is a base of the context URI

        final ModuleJarURI contextJSModuleUri =
            new ModuleJarURI(contextUri).normalized();
        final Optional<String> resolvedModulePath =
            resolve(id, contextJSModuleUri.getJarEntryPath());
        if (! resolvedModulePath.isPresent()) {
            logFine(() -> MessageFormat.format(
                "failed to resolve module. moduleId=''{0}''",
                id.toString()
            ));
            return Optional.empty();
        }

        final URI resolvedModuleUri;
        try {
            resolvedModuleUri = ModuleJarURI.buildJarUri(
                contextJSModuleUri.getJarFilePath(),
                resolvedModulePath.get());
        } catch(final URISyntaxException | IOException e) {
            logFine(() -> MessageFormat.format(
                "failed to build resolved module URI. " +
                "jar file path=''{0}'', resolved module path=''{1}''",
                contextJSModuleUri.getJarFilePath(),
                resolvedModulePath.get()
            ));
            return Optional.empty();
        }

        // make sure the resolved module URI is still a child URI of the
        // base URI of this repo
        if (!isBaseOf(resolvedModuleUri)) {
            logFine(() -> MessageFormat.format(
                "failed to resolve module. moduleId=''{0}''. " +
                "resolved module URI isn''t a child of the base URI. " +
                "module id=''{0}'', base URI=''{1}'', resolved URI=''{2}''",
                id.toString(), jarUri.toURI().toString(),
                resolvedModuleUri.toString()
            ));
            return Optional.empty();
        }
        return Optional.of(resolvedModuleUri);
    }
}

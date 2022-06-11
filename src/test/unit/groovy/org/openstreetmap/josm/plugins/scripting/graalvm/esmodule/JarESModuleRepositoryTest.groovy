package org.openstreetmap.josm.plugins.scripting.graalvm.esmodule

import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.openstreetmap.josm.plugins.scripting.BaseTestCase
import java.nio.file.Path

class JarESModuleRepositoryTest extends BaseTestCase {

    @Test
    void "can create a repo"() {
        final file = new File(getProjectHome(), "src/test/resources/es-modules/es-modules.jar")
        final repo = new JarESModuleRepository(file)
        assertNotNull(repo)
    }

    @Test
    void "can create a repo with an existing zip entry as root"() {
        def file = new File(getProjectHome(), "src/test/resources/es-modules/es-modules.jar")
        def root = "josm"
        def repo = new JarESModuleRepository(file, root)
        assertNotNull(repo)

        // should work with an absolute path too
        root = "/josm"
        repo = new JarESModuleRepository(file, root)
        assertNotNull(repo)
    }

    @Test
    void "reject creating a repo when jar file doesn't exist"()  {
        final file = new File("no-such-jar.jar")
        shouldFail(IOException) {
            final repo = new JarESModuleRepository(file)
        }
    }

    @Test
    void "reject creating a repo with nulls as parameters"() {
        shouldFail(NullPointerException) {
            final repo = new JarESModuleRepository(null, "foo")
        }
        shouldFail(NullPointerException) {
            final repo = new JarESModuleRepository(new File("foo"), null)
        }
        shouldFail(NullPointerException) {
            final repo = new JarESModuleRepository(null, null)
        }
    }

    @Test
    void "reject creating a repo with non existing zip entry for the root"() {
        final file = new File(getProjectHome(), "src/test/resources/es-modules/es-modules.jar")
        final root = "no/such/root"
        shouldFail(IllegalArgumentException) {
            final repo = new JarESModuleRepository(file, root)
        }
    }

    private JarESModuleRepository repo

    @BeforeEach
    void initRepo() {
        final file = new File(getProjectHome(), "src/test/resources/es-modules/es-modules.jar")
        repo = new JarESModuleRepository(file)
    }

    @Test
    void "can resolve path to existing module in jar"() {

        def modulePath = "foo"
        def resolvedPath = repo.resolveModulePath(modulePath)
        assertNotNull(resolvedPath)
        assertTrue(resolvedPath.startsWith(repo.getUniquePathPrefix()))

        modulePath = "./foo"
        resolvedPath = repo.resolveModulePath(modulePath)
        assertNotNull(resolvedPath)
        assertEquals(Path.of(repo.getUniquePathPrefix().toString(), "foo.mjs"), resolvedPath)

        modulePath = "foo.mjs"
        resolvedPath = repo.resolveModulePath(modulePath)
        assertNotNull(resolvedPath)
        assertEquals(Path.of(repo.getUniquePathPrefix().toString(), "foo.mjs"), resolvedPath)

        modulePath = "sub/../foo"
        resolvedPath = repo.resolveModulePath(modulePath)
        assertNotNull(resolvedPath)
        assertEquals(Path.of(repo.getUniquePathPrefix().toString(), "foo.mjs"), resolvedPath)

        modulePath = Path.of(repo.getUniquePathPrefix().toString(),"foo")
        resolvedPath = repo.resolveModulePath(modulePath)
        assertNotNull(resolvedPath)
        assertEquals(Path.of(repo.getUniquePathPrefix().toString(), "foo.mjs"), resolvedPath)

        modulePath = "sub/bar"
        resolvedPath = repo.resolveModulePath(modulePath)
        assertNotNull(resolvedPath)
        assertEquals(Path.of(repo.getUniquePathPrefix().toString(), "sub/bar.mjs"), resolvedPath)

        modulePath = "sub/bar.mjs"
        resolvedPath = repo.resolveModulePath(modulePath)
        assertNotNull(resolvedPath)
        assertEquals(Path.of(repo.getUniquePathPrefix().toString(), "sub/bar.mjs"), resolvedPath)

        modulePath = "sub/././bar.mjs"
        resolvedPath = repo.resolveModulePath(modulePath)
        assertNotNull(resolvedPath)
        assertEquals(Path.of(repo.getUniquePathPrefix().toString(), "sub/bar.mjs"), resolvedPath)

        modulePath = "sub/baz/.././bar"
        resolvedPath = repo.resolveModulePath(modulePath)
        assertNotNull(resolvedPath)
        assertEquals(Path.of(repo.getUniquePathPrefix().toString(), "sub/bar.mjs"), resolvedPath)

        // resolves against a .js file
        modulePath = "sub/baz"
        resolvedPath = repo.resolveModulePath(modulePath)
        assertNotNull(resolvedPath)
        assertEquals(Path.of(repo.getUniquePathPrefix().toString(), "sub/baz.js"), resolvedPath)
    }

    @Test
    void "rejects resolution to non-existing modules"() {
        def modulePath = "no-such-module"
        def resolvedPath = repo.resolveModulePath(modulePath)
        assertNull(resolvedPath)

        // sub is a directory entry, not a file entry
        modulePath = "sub"
        resolvedPath = repo.resolveModulePath(modulePath)
        assertNull(resolvedPath)

        // no sub/baz, sub/baz.js, or sub/baz.mjs
        modulePath = "sub/no-such-module"
        resolvedPath = repo.resolveModulePath(modulePath)
        assertNull(resolvedPath)
    }
}

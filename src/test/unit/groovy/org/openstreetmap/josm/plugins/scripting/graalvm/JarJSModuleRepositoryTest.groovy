package org.openstreetmap.josm.plugins.scripting.graalvm

import groovy.test.GroovyTestCase
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.Disabled
import org.junit.jupiter.api.Test
import org.openstreetmap.josm.plugins.scripting.graalvm.commonjs.BaseJSModuleRepository
import org.openstreetmap.josm.plugins.scripting.graalvm.commonjs.JarJSModuleRepository

import java.util.jar.JarFile
import java.util.logging.ConsoleHandler
import java.util.logging.Level
import java.util.logging.Logger

class JarJSModuleRepositoryTest extends GroovyTestCase {

    static def projectHome

    @BeforeAll
    static void readEnvironmentVariables() {
        projectHome = System.getenv("JOSM_SCRIPTING_PLUGIN_HOME")
        if (projectHome == null) {
            throw new Exception(
                "environment variable JOSM_SCRIPTING_PLUGIN_HOME missing")
        }
    }

    @BeforeAll
    static void enableLogging() {
        Logger.getLogger(BaseJSModuleRepository.class.getName())
                .setLevel(Level.FINE)

        Logger.getLogger("")
                .getHandlers().findAll {
            it instanceof ConsoleHandler
        }.each {
            it.level = Level.FINE
        }
    }

    static String jarReposBaseDir() {
        return "${projectHome}/test/data/jar-repos"
    }

    static File testJarFile(String name){
        return new File(jarReposBaseDir(), name)
    }

    @Test
    void "constructor - accept an existing jar file"() {
        def jar = testJarFile("jar-repo-1.jar")
        new JarJSModuleRepository(jar)
    }

    @Test
    void "constructor - reject null jar"() {
        shouldFail(NullPointerException.class) {
            new JarJSModuleRepository(null as File)
        }
    }

    @Test
    void "constructor - reject non existing jar"() {
        shouldFail(IOException.class) {
            new JarJSModuleRepository(new File("no-such-jar.jar"))
        }
    }

    @Test
    void "constructor - accept jar with existing path"() {
        def jar = testJarFile("jar-repo-2.jar")
        def path = "/foo"
        new JarJSModuleRepository(jar, path)
    }

    @Test
    void "constructor - reject null path"() {
        shouldFail(NullPointerException.class) {
            def jar = testJarFile("jar-repo-2.jar")
            new JarJSModuleRepository(jar, null)
        }
    }

    @Test
    void "constructor - reject empty path"() {
        shouldFail(IllegalArgumentException.class) {
            def jar = testJarFile("jar-repo-2.jar")
            new JarJSModuleRepository(jar, " \t ")
        }
    }

    @Test
    void "constructor - reject non absolute path path"() {
        shouldFail(IllegalArgumentException.class) {
            def jar = testJarFile("jar-repo-2.jar")
            new JarJSModuleRepository(jar, "foo")
        }
    }

    @Test
    void "constructor - accept jar URI with a root path"() {
        def jar = testJarFile("jar-repo-2.jar")
        new JarJSModuleRepository(new URI("jar:${jar.toURI()}!/"))
    }

    @Test
    void "constructor  accept jar URI with existing jar path"() {
        def jar = testJarFile("jar-repo-2.jar")
        new JarJSModuleRepository(new URI("jar:${jar.toURI()}!/foo"))
    }

    @Test
    void "constructor - reject jar URI with non-existing path"() {
        shouldFail(IOException) {
            def jar = testJarFile("jar-repo-2.jar")
            new JarJSModuleRepository(new URI("jar:${jar.toURI()}!/no-such-path"))
        }
    }

    @Test
    void "constructor - reject jar URI pointing to a file jar entry, not a directory"() {
        shouldFail(IOException.class) {
            def jar = testJarFile("jar-repo-2.jar")
            new JarJSModuleRepository(new URI("jar:${jar.toURI()}!/bar.js"))
        }
    }

    @Test
    void "constructor - reject a file URI"() {
        shouldFail(IllegalArgumentException.class) {
            def jar = testJarFile("jar-repo-2.jar")
            new JarJSModuleRepository(jar.toURI())
        }
    }

    @Test
    void "isBaseOf - accept if context is equal to base URI"() {
        def jar = testJarFile("jar-repo-2.jar")
        def repo = new JarJSModuleRepository(jar)
        def contextUri = new URI("jar:${jar.toURI()}!/")
        assertTrue(repo.isBaseOf(contextUri))
    }

    @Test
    void "isBaseOf - accept if context is a child file"() {
        def jar = testJarFile("jar-repo-2.jar")
        def repo = new JarJSModuleRepository(jar, "/foo")
        def contextUri = new URI("jar:${jar.toURI()}!/foo/baz.js")
        assertTrue(repo.isBaseOf(contextUri))
    }

    @Test
    void "isBaseOf - accept if context is a child path to a file"() {
        def jar = testJarFile("jar-repo-2.jar")
        def repo = new JarJSModuleRepository(jar, "/foo")
        def contextUri = new URI("jar:${jar.toURI()}!/foo/bar/baz.js")
        assertTrue(repo.isBaseOf(contextUri))
    }

    @Test
    void "isBaseOf - reject if context is in another jar file"() {
        def jar = testJarFile("jar-repo-2.jar")
        def repo = new JarJSModuleRepository(jar)

        def other = testJarFile("jar-repo-1.jar")
        def contextUri = new URI("jar:${other.toURI()}!/")
        assertFalse(repo.isBaseOf(contextUri))
    }

    @Test
    void "isBaseOf - reject if context isn't a path prefix"() {
        def jar = testJarFile("jar-repo-2.jar")
        def repo = new JarJSModuleRepository(jar, "/foo")
        def contextUri = new URI("jar:${jar.toURI()}!/bar/baz.js")
        assertFalse(repo.isBaseOf(contextUri))
    }

    @Test
    void "isBaseOf - reject if context is only a string prefix, not a path prefix"() {
        def jar = testJarFile("jar-repo-2.jar")
        def repo = new JarJSModuleRepository(jar, "/foo")
        def contextUri = new URI("jar:${jar.toURI()}!/foobar")
        assertFalse(repo.isBaseOf(contextUri))
    }

    @Test
    void "resolve - should resolve an existing module 'bar'"() {
        def jar = testJarFile("jar-repo-2.jar")
        def repo = new JarJSModuleRepository(jar)
        def resolvedUri = repo.resolve("bar")
        assertTrue(resolvedUri.isPresent())
    }

    @Test
    void "resolve - should resolve an existing module 'bar_dot_js'"() {
        def jar = testJarFile("jar-repo-2.jar")
        def repo = new JarJSModuleRepository(jar)
        def resolvedUri = repo.resolve("bar.js")
        assertTrue(resolvedUri.isPresent())
    }

    @Test
    void "resolve - should resolve an existing module 'foo_slash_baz'"() {
        def jar = testJarFile("jar-repo-2.jar")
        def repo = new JarJSModuleRepository(jar)
        def resolvedUri = repo.resolve("foo/baz")
        assertTrue(resolvedUri.isPresent())
    }

    @Test
    void "resolve - should resolve an existing module 'module-1' with index_dot_js"() {
        def jar = testJarFile("jar-repo-2.jar")
        def repo = new JarJSModuleRepository(jar)
        def resolvedUri = repo.resolve("module-1")
        assertTrue(resolvedUri.isPresent())
    }

    @Test
    void "resolve - must not resolve a non-existing module"() {
        def jar = testJarFile("jar-repo-2.jar")
        def repo = new JarJSModuleRepository(jar)
        def resolvedUri = repo.resolve("no-such-module")
        assertFalse(resolvedUri.isPresent())
    }

    @Test
    void "resolve - must not resolve a non-existing module 'foo_slash_baz_slash_bar'"() {
        def jar = testJarFile("jar-repo-2.jar")
        def repo = new JarJSModuleRepository(jar)
        def resolvedUri = repo.resolve("foo/baz/bar")
        assertFalse(resolvedUri.isPresent())
    }

    @Test
    void "resolve - must not resolve a module 'module-2' with no index_dot_js"() {
        def jar = testJarFile("jar-repo-2.jar")
        def repo = new JarJSModuleRepository(jar)
        def resolvedUri = repo.resolve("module-2")
        assertFalse(resolvedUri.isPresent())
    }

    @Test
    void "resolve with context - given context refers to a dir, should resolve existing module with a relative id"() {
        def jar = testJarFile("jar-repo-2.jar")
        def repo = new JarJSModuleRepository(jar)
        def contextUri = ModuleJarURI.buildJarUri(jar.toString(), "/foo")
        def resolvedUri = repo.resolve("./baz", contextUri)
        assertTrue(resolvedUri.isPresent())
    }

    @Test
    void "resolve with context - given context refers to a dir, should resolve existing module with a relative id (2)"() {
        def jar = testJarFile("jar-repo-2.jar")
        def repo = new JarJSModuleRepository(jar)
        def contextUri = ModuleJarURI.buildJarUri(jar.toString(), "/foo")
        def resolvedUri = repo.resolve("./baz.js", contextUri)
        assertTrue(resolvedUri.isPresent())
    }

    @Test
    void "resolve with context - given context refers to a dir, should resolve existing module with a relative id (3)"() {
        def jar = testJarFile("jar-repo-2.jar")
        def repo = new JarJSModuleRepository(jar)
        def contextUri = ModuleJarURI.buildJarUri(jar.toString(), "/foo")
        def resolvedUri = repo.resolve("../foo/./baz", contextUri)
        assertTrue(resolvedUri.isPresent())
    }

    @Test
    void "resolve with context - given context refers to a file, should resolve existing module"() {
        def jar = testJarFile("jar-repo-2.jar")
        def repo = new JarJSModuleRepository(jar)
        def contextUri = ModuleJarURI.buildJarUri(jar.toString(), "/foo/baz.js")
        def resolvedUri = repo.resolve("../bar", contextUri)
        assertTrue(resolvedUri.isPresent())
    }

    // ----------------------------------------------------------------------
    // exploratory tests. finding out how to use File, URI, URL methods
    // now decorated with @Ignore annotation, not part of the test suite
    // for the JOSM scripting plugin
    // ----------------------------------------------------------------------
    @Test
    @Disabled
    void "can create jar URI with relative path"() {
        def jar = testJarFile("jar-repo-2.jar")
        def uri1 = new URI("jar:${jar.toURI()}!../")
        shouldFail(MalformedURLException) {
            uri1.toURL()
        }

        // not allowed, must start with /
        def uri2 = new URI("jar:${jar.toURI()}!./.././foo")
        shouldFail(MalformedURLException) {
            uri2.toURL()
        }

        // not allowed, must start with /
        def uri3 = new URI("jar:${jar.toURI()}!.//.././foo")
        shouldFail(MalformedURLException) {
            uri3.toURL()
        }

        // not allowed, must start with !/
        def uri4 = new URI("jar:${jar.toURI()}!foo")
        shouldFail(MalformedURLException) {
            uri4.toURL()
        }

        // jar URI can include segments '.' and '..'
        def uri5 = new URI("jar:${jar.toURI()}!/../foo")
        uri5.toURL()

        // jar URI can include segments '.' and '..'
        def uri6 = new URI("jar:${jar.toURI()}!/./.././foo")
        uri6.toURL()
    }

    @Test
    @Disabled
    void "list jar entries"() {
        def jar = testJarFile("jar-repo-2.jar")
        def jarFile = new JarFile(jar)
        jarFile.entries().each {entry ->
            println(entry.getName())
        }

        println("bar.js: " + jarFile.getEntry("bar.js")?.getName())
        println("foo: " + jarFile.getEntry("foo")?.getName())
        println("foo/: " + jarFile.getEntry("foo/")?.getName())
        println("/foo: " + jarFile.getEntry("/foo")?.getName())
        println("foo//: " + jarFile.getEntry("foo//")?.getName())
    }

    @Test
    @Disabled
    void "build jar URLs"() {
        def jar = testJarFile("jar-repo-2.jar")
        def uri1 =  new URI("jar:file:${jar.getAbsolutePath()}!/")
        def url1  = new URL(uri1.toURL(), "/foo/bar.js")
        println(url1.toURI().toString())

        def uri2 =  new URI("jar:file:${jar.getAbsolutePath()}!/../../")
        println(uri2.toURL().toString())
        def url2  = new URL(uri2.toURL(), "/foo/bar.js")
        println(url2.toURI().toString())

        def uri3 =  new URI("jar:file:${jar.getAbsolutePath()}!/foo/bar/baz")
        def url3  = new URL(uri3.toURL(), "./.././baz/../../a.js")
        println(url3.toURI().toString())
    }

    @Test
    @Disabled
    void "test java_dot_nio_dot_Paths operations"() {
        def path = new File("/../../").toPath().normalize().toString()
        assertEquals("/", path)

        path = new File("/././foo/bar/../").toPath().normalize().toString()
        assertEquals("/foo", path)

        path = new File("/././foo/bar/..").toPath().normalize().toString()
        assertEquals("/foo", path)

        path = new File("/././foo/////bar/..").toPath().normalize().toString()
        assertEquals("/foo", path)
    }
}

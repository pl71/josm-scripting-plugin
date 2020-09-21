# JOSM Scripting Plugin

The JOSM scripting plugin executes scripts in the [Open Street Map](http://www.openstreetmap.org) editor
[JOSM](http://josm.openstreetmap.de/).

Scripts can be defined in any scripting language for which a
[JSR-223](http://www.jcp.org/aboutJava/communityprocess/pr/jsr223/) compatible script engine is available, in  particular in
* [JavaScript](http://en.wikipedia.org/wiki/JavaScript)
* [Groovy](http://groovy.codehaus.org/)
* [Ruby](http://www.ruby-lang.org/en/)
* [Python](http://www.python.org/)

## For JOSM users
The scripting plugin can be installed and kept up to date using JOSMs plugin manager:

1. Select Preferences -> Plugins
2. Search for the plugin "Scripting" and install it

## For developers
The scripting plugin includes an embedded scripting engine for JavaScript based on
[Mozilla Rhino](http://www.mozilla.org/rhino/).
It provides a custom JavaScript API to write scripts for the JOSM editor,refer to
the [API documentation](http://gubaer.github.com/josm-scripting-plugin/).

Furthermore, it can
* load and execute [plugins written in Python](http://gubaer.github.com/josm-scripting-plugin/doc/python.html).
* execute scripts written in Ruby, Groovy, and other languages, refer to
[these examples](https://github.com/Gubaer/josm-scripting-plugin/tree/master/src/main/resources/scripts).

If you want to contribute to the scripting plugin itself, please fork this repository and
submit your pull requests.

## How to build

Add a new entry to [releases.conf](releases.conf) then run:

```bash
$ git checkout deploy          # switch to deploy branch
$ git merge master             # make sure the latest changes are merged to 'deploy'
$ git push origin deploy       # push the 'deploy' branch

$ ./gradlew clean build        # build the plugin
$ ./gradlew deploy             # deploys the plugin jar to github,
                               # where it is picked up by the JOSM
                               # plugin installer
```

## How to test

There are two suites of unit tests:
1. a suite of unit tests implemented in Java and Groovy
2. a suite of unit tests implemented in JavaScript which provide test cases for the JavaScript API

How to run:
```bash
# build the plugin and run the tests
$ ./gradlew check
# ... or run the checks only, without building
$ ./gradlew cleanTest cleanTestScriptApi check
```

## How to update the i18n resources
Localized strings are uploaded to [Transifex](https://www.transifex.com/). This step is
executed automatically when the scripting plugin is built on the master branch by [travis](https://travis-ci.org/).

Translated resources can be downloaded periodically from Transifex and then commited to the github repository.

```bash
# install the transifex client
# see transifex documentation: https://docs.transifex.com/client/installing-the-client
$ sudo apt install python3-pip
$ sudo pip3 install transifex-client

# createa an API key for transifex, see https://docs.transifex.com/api/introduction
# create a file with the transifex api key
$ touch $HOME/.transifexrc

# edit $HOME/.transifexrc and add the following content
[https://www.transifex.com]
api_hostname = https://api.transifex.com
hostname = https://www.transifex.com
password = <the transifex api key>
username = api

# For new languages, or when updating only certain languages:
# Download the german translations into src/main/po/de.po
# Shorten the de.po file, removes unnecessary parts
# Then commit it to git
$ tx pull -l de
$ ./gradlew shortenPoFiles
$ git stage src/main/po
$ git commit

# For existing languages:
# Downloads translations for all existing languages into src/main/po/
$ ./gradlew transifexDownload
$ git stage src/main/po
$ git commit

# build the plugin
$ ./gradlew build
```

## Build status

[![Build Status](https://travis-ci.org/Gubaer/josm-scripting-plugin.svg?branch=master)](https://travis-ci.org/Gubaer/josm-scripting-plugin.svg?branch=master)

## Credits
The JOSM scripting plugin uses:

* jsyntaxpane by Ayman Al-Sairafi
* [Rhino](http://www.mozilla.org/rhino/) scripting engine by Mozilla Foundation

* supported by [![JetBrains logo](jetbrains.png)](https://www.jetbrains.com/?from=JOSM%20Scripting%20Plugin) with a free JetBrains Open Source license


## License
Published under GPL Version 3 and higher. See included LICENSE file.

package org.openstreetmap.josm.plugins.scripting.graalvm;

import org.graalvm.polyglot.Value;
import org.openstreetmap.josm.actions.JosmAction;
import org.openstreetmap.josm.data.osm.OsmPrimitive;
import org.openstreetmap.josm.gui.MainApplication;
import org.openstreetmap.josm.tools.ImageProvider;
import org.openstreetmap.josm.tools.Shortcut;

import javax.swing.*;
import javax.validation.constraints.Null;
import java.awt.event.ActionEvent;
import java.awt.event.KeyEvent;
import java.text.MessageFormat;
import java.util.Collection;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.logging.Level;
import java.util.logging.Logger;

@SuppressWarnings("unused")
public class JSAction extends JosmAction {
    static private final Logger logger = Logger.getLogger(JSAction.class.getName());
    private final static AtomicInteger counter = new AtomicInteger();

    static private String propertyAsString(Value object,
            String property, String defaultValue) {
        try {
            final Value prop = object.getMember(property);
            if (prop == null) {
                return defaultValue;
            }
            return prop.asString();
        } catch(UnsupportedOperationException e) {
            logger.log(Level.WARNING, MessageFormat.format(
                "Failed to invoke getMember() on polyglot value for property '{0}'",
                property
            ), e);
            return null;
        }
    }

    @SuppressWarnings("SameParameterValue")
    static private Value propertyAsFunction(Value object,
        String property, Value defaultValue) {
        try {
            final Value value = object.getMember(property);
            if (value == null || !value.canExecute()) {
                return defaultValue;
            }
            return value;
        } catch(UnsupportedOperationException e) {
            logger.log(Level.WARNING, MessageFormat.format(
                "Failed to invoke getMember() on polyglot value for property '{0}'",
                property
            ), e);
            return null;
        }
    }

    /**
     * Creates the JS action with the properties in <code>properties</code>
     *
     * @param properties the properties
     */
    public JSAction(Value properties) {
        final String name = propertyAsString(properties, "name", "JSAction"
                + counter.incrementAndGet());
        final String iconName = propertyAsString(properties, "iconName", null);
        final String tooltip = propertyAsString(properties, "tooltip", null);
        final String toolbarId = propertyAsString(properties, "toolbarId",
                "toolbar" + counter.incrementAndGet());
        onExecute = propertyAsFunction(properties, "onExecute", null);
        onInitEnabled = propertyAsFunction(properties, "onInitEnabled", null);
        onUpdateEnabled = propertyAsFunction(properties, "onUpdateEnabled", null);
        putValue(NAME, name);
        putValue(SHORT_DESCRIPTION, tooltip);
        if (iconName != null) {
            Icon icon = ImageProvider.getIfAvailable(iconName);
            if (icon != null) {
                putValue(SMALL_ICON, icon);
            }
        }
        // just remember the id. It will be used later, when the action is added
        // to the toolbar
        this.putValue("toolbarId", toolbarId);

        //TODO(gubaer): should accept shortcut as parameter
        //Extend later. First, add scripting contexts which are preserved between
        //script invocation. Otherwise, attaching scripts to menu items want
        //work.
        //Then allow users to define a shortcut with the four parameters
        //necessary for Shortcut::registerShortcut(), see
        //https://github.com/JOSM/josm/blob/3af7bae967e273dcee423ca0aac04524615d5ba5/src/org/openstreetmap/josm/tools/Shortcut.java#L517
        this.sc = Shortcut.registerShortcut(name, name, KeyEvent.VK_0,
                Shortcut.NONE);
        MainApplication.registerActionShortcut(this, sc);
        initEnabledState();
    }

    private Value onExecute;
    private Value onInitEnabled;
    private Value onUpdateEnabled;

    @SuppressWarnings("unused") // part of the public API, used in JavaScript
    public @Null Value getOnExecute() {
        return onExecute;
    }

    /**
     * Sets the JavaScript function to be invoked when the action is
     * triggered.
     *
     * @param onExecute the JavaScript function to be invoked
     * @throws IllegalArgumentException if <code>onExecute</code> isn't
     * executable
     */
    @SuppressWarnings("unused") // part of the public API, used in JavaScript
    public void setOnExecute(@Null Value onExecute) {
        if (onExecute == null || onExecute.isNull()) {
            this.onExecute = null;
        } else {
            if (!onExecute.canExecute()) {
                throw new IllegalArgumentException(MessageFormat.format(
                    "executable value expected, got ''{0}''", onExecute
                ));
            }

            this.onExecute = onExecute;
        }
    }

    /**
     * Sets the JavaScript function which is invoked to initialize
     * the state (enabled/disabled) of this action
     *
     * @param onInitEnabled the JavaScript function
     * @throws IllegalArgumentException if <code>onInitEnabled</code> isn't
     * executable
     */
    @SuppressWarnings("unused") // part of the public API, used in JavaScript
    public void setOnInitEnabled(@Null Value onInitEnabled) {
        if (onInitEnabled == null || onInitEnabled.isNull()) {
            this.onInitEnabled = null;
        } else {
            if (!onInitEnabled.canExecute()) {
                throw new IllegalArgumentException(MessageFormat.format(
                    "executable value expected, got ''{0}''", onInitEnabled
                ));
            }
            this.onInitEnabled = onInitEnabled;
        }
    }

    /**
     * Replies the JavaScript function which is invoked to initialize
     * the state (enabled/disabled) of this action
     *
     * @return the function;  null, if no function is set
     */
    @SuppressWarnings("unused") // part of the public API
    public @Null Value getOnInitEnabled() {
        return onInitEnabled;
    }

    /**
     * Sets the JavaScript function which is invoked to update
     * the state (enabled/disabled) of this action
     *
     * @param onUpdateEnabled the JavaScript function
     * @throws IllegalArgumentException if <code>onUpdateEnabled</code> isn't
     * executable
     */
    @SuppressWarnings("unused")  // part of the public API
    public void setOnUpdateEnabled(Value onUpdateEnabled) {
        if (onUpdateEnabled == null || onUpdateEnabled.isNull()) {
            this.onUpdateEnabled = null;
        } else {
            if (!onUpdateEnabled.canExecute()) {
                throw new IllegalArgumentException(MessageFormat.format(
                    "executable value expected, got ''{0}''", onUpdateEnabled
                ));
            }
            this.onUpdateEnabled = onUpdateEnabled;
        }
    }

    /**
     * Replies the JavaScript function which is invoked to update
     * the state (enabled/disabled) of this action
     *
     * @return the function; null, if no function is set
     */
    @SuppressWarnings("unused") // part of the public API, used in JavaScript
    public @Null Value getOnUpdateEnabled() {
        return onUpdateEnabled;
    }

    @Override
    public void actionPerformed(ActionEvent evt) {
        if (onExecute == null || ! onExecute.canExecute()) {
            return;
        }
        onExecute.execute(evt);
    }

    @Override
    protected void initEnabledState() {
        if (onInitEnabled == null || !onInitEnabled.canExecute()) {
            return;
        }
        onInitEnabled.execute();
    }

    @Override
    protected void updateEnabledState() {
        if (onUpdateEnabled == null || !onUpdateEnabled.canExecute()) {
            return;
        }
        onUpdateEnabled.execute();
    }

    @Override
    protected void updateEnabledState(
            Collection<? extends OsmPrimitive> selection) {
        if (onUpdateEnabled == null || !onUpdateEnabled.canExecute()) {
            return;
        }
        onUpdateEnabled.execute(selection);
    }

    /**
     * Replies the name of the JSAction
     * @return the name
     */
    public Value getName() {
        return Value.asValue(getValue(Action.NAME));
    }

    /**
     * Set the name of the JSAction
     *
     * @param name the name. Ignored, if nullish; otherwise,
     *   converted to a string with {@link #toString()}
     */
    public void setName(@Null Value name) {
        if (name == null || name.isNull()) {
            return;
        }
        putValue(Action.NAME, name.toString());
    }

    /**
     * Replies the tooltip
     * @return the tooltip
     */
    public Value getTooltip() {
        return Value.asValue(getValue(Action.SHORT_DESCRIPTION));
    }

    /**
     * Set the tooltip of the JSAction
     *
     * @param tooltip the tooltip. Ignored, if null like; otherwise,
     *   converted to a string with {@link #toString()}
     * @deprecated invoking from JavaScript fails when invoked with a string
     *    as value because the method overloads {@link #setTooltip(String)}. Use
     *    {@link #setTooltipWithValue(Value)} instead.
     */
    @Deprecated(since = "0.2.2", forRemoval = true)
    public void setTooltip(@Null Value tooltip) {
        if (tooltip == null || tooltip.isNull()) {
            return;
        }
        setTooltip(tooltip.toString());
    }

    /**
     * Set the tooltip of the JSAction
     *
     * @param tooltip the tooltip. Ignored, if null like; otherwise,
     *   converted to a string with {@link #toString()}
     */
    public void setTooltipWithValue(@Null Value tooltip) {
        if (tooltip == null || tooltip.isNull()) {
            return;
        }
        setTooltip(tooltip.toString());
    }
}

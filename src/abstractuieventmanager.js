class AbstractUIEventManager {
    addEventListener(uiEventName, eventHandler) {
        //
    }

    click(element, button, x, y) {
        //
    }

    mouseDown(element, triggerButton, buttonState, modifierKeyState, x, y) {
        //
    }

    mouseUp(element, triggerButton, buttonState, x, y) {
        //
    }

    keyPress(key) {
        //
    }

    keyDown(key, modifierKeyState) {
        //
    }

    keyUp(key, modifierKeyState) {
        //
    }
}

module.exports = AbstractUIEventManager;
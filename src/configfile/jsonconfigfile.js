const AbstractConfigFile = require('./abstractconfigfile');

class JSONConfigFile extends AbstractConfigFile {
    constructor(filePath) {
        super(filePath);
    }

    load() {
        let textContent = this._readText(this.filePath);
        return JSON.parse(textContent);
    }

    save(obj) {
        let textContent = JSON.stringify(obj);
        this._writeText(this.filePath, textContent);
    }
}

module.exports = JSONConfigFile;
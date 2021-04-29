const AbstractConfigFile = require('./abstractconfigfile');

class YAMLConfigFile extends AbstractConfigFile {
    constructor(filePath) {
        super(filePath);
    }

    load() {
        let textContent = this._readText(this.filePath);
        return jsyaml.safeLoad(textContent);
    }

    save(obj) {
        let options = {
			skipInvalid: true
		};

        // jsyaml.safeDump 等效于 JSON.stringify
		let textContent = jsyaml.safeDump(obj, options);
        this._writeText(this.filePath, textContent);
    }
}

module.exports = YAMLConfigFile;
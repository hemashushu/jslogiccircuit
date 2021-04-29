class AbstractConfigFile {

    constructor(filePath) {
        this.filePath = filePath;
    }

    save(obj) {
        //
    }

    load() {
        //
    }

    exists() {
        return AbstractConfigFile.exists(this.filePath);
    }

    _writeText(filePath, text) {
        fs.writeFileSync(filePath, text);
    }

    _readText(filePath) {
        return fs.readFileSync(filePath);
    }

    static exists(filePath) {
        try {
            fs.accessSync(filePath)
            return true;
        }catch(e) {
            //
        }
        return false;
    }
}

module.exports = AbstractConfigFile;
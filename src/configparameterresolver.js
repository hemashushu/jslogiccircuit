const path = require('path');
const fsPromise = require('fs/promises');

const { Buffer } = require('buffer');

const { ParseException, IOException } = require('jsexception');
const { PromiseFileConfig, YAMLFileConfig } = require('jsfileconfig');

const ConfigParameterValueType = require('./configparametervaluetype');

/**
 * 配置文件里面的 parameters 属性（比如 defaultParameters）加载器
 *
 * parameters 属性的值是一个 Map，结构如下：
 * {
 *   param_name_1: {
 *     valueType: STRING,
 *     value: VARIABLE,
 *     descript: STRING,
 *     descript[LOCALE_CODE]: STRING
 *   },
 *   param_name_2: {
 *     valueType: number,
 *     value: 8
 *   },
 *   ...
 * }
 *
 * 即这个 Map 由一个或多个属性组成，每个属性的名称是 parameter 的名称，
 * 属性的值是该 parameter 的详细信息，它又是一个 Map。
 *
 * 其中的 valueType 是一个字符串枚举，可能的值有：
 * - range，表示值是一个某个范围的数字
 * - number，表示值是任意数字
 * - option，表示值只能是候选值当中的一个
 * - object，表示值是一个对象（一个纯数据对象或者一个数组）
 * - binary，表示值是一个二进制数据
 *
 * 当 valueType 的值不同时，paramater 的详细信息结构也
 * 不同，比如当 valueType 为：
 * - range
 *   详细信息会有
 *   valueRange: {from, to}
 *   表示数值可选取的范围
 * - option
 *   详细信息会有
 *   valueOptions: [item1, item2, ...]
 *   表示可选取的候选值，一般为数字类型的数组
 * - object
 *   详细信息会有：
 *   - objectSourceType: config|file
 *   - objectSourceFilePath: fileName
 *   objectSourceType 表示对象源，可以是在当前配置文件本身，也可以是指定的
 *   一个外部文件。
 *   objectSourceFilePath 是一个相对路径，表示位于项目的 data 文件夹之内的
 *   一个文件，文件格式必须是 YAML。
 * - binary
 *   详细信息会有：
 *   - binarySourceType: config|file
 *   - binarySourceFilePath: fileName
 *   binarySourceType 表示对象源，可以是在当前配置文件本身，即详细信息中的
 *   value 属性的值，为一个字节数组的 hex 编码的字符串，也可以是指定的
 *   一个外部文件。
 *   binarySourceFilePath 是一个相对路径，表示位于项目的 data 文件夹之内的
 *   一个文件，文件可以是任何格式，参数加载器会读入文件并且以
 *   字节数组（Nodejs 的 Buffer 对象，Uint8Array 的派生对象）的形式作为属性值。
 *   https://nodejs.org/api/buffer.html
 *   https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array
 */
class ConfigParameterResolver {

    /**
     * 将配置文件里的 parameters 转换成逻辑模块所使用的 parameters 对象。
     *
     * - 如果配置值超出 range 范围，则抛出 ParseException 异常。
     * - 如果指定的文件找不到，则抛出 FileNotFoundException 异常。
     * @param {*} configParameters
     * @param {*} packageResourceLocator
     * @returns
     */
    static async resolve(configParameters, packageResourceLocator) {
        let parameters = {};

        for (let key in configParameters) {
            let value;

            let detail = configParameters[key];
            switch (detail.valueType) {
                case ConfigParameterValueType.number:
                    {
                        value = detail.value;
                        break;
                    }

                case ConfigParameterValueType.range:
                    {
                        value = detail.value;
                        let from = detail.from;
                        let to = detail.to;

                        if (value < from || value > to) {
                            throw new ParseException(
                                `Parameter "${key}" value out of range.`);
                        }
                        break;
                    }

                case ConfigParameterValueType.option:
                    {
                        value = detail.value;
                        let valueOptions = detail.valueOptions;

                        if (!valueOptions.includes(value)) {
                            throw new ParseException(
                                `Parameter "${key}" value out of options.`);
                        }
                        break;
                    }

                case ConfigParameterValueType.object:
                    {
                        let objectSourceType = detail.objectSourceType;
                        if (objectSourceType === 'config') {
                            value = detail.value;
                        } else if (objectSourceType === 'file') {
                            let dataDirectory = packageResourceLocator.getDataDirectory();
                            let objectFilePath = path.join(dataDirectory, detail.objectSourceFilePath);
                            let fileConfig = new YAMLFileConfig();
                            let promiseFileConfig = new PromiseFileConfig(fileConfig);
                            value = await promiseFileConfig.load(objectFilePath);
                        } else {
                            throw new ParseException(
                                `Unknown parameter object source type: ${objectSourceType}.`);
                        }
                        break;
                    }

                case ConfigParameterValueType.binary:
                    {
                        let binarySourceType = detail.binarySourceType;
                        if (binarySourceType === 'config') {
                            // https://nodejs.org/api/buffer.html#buffer_static_method_buffer_from_string_encoding
                            value = Buffer.from(detail.value, 'hex');

                        } else if (binarySourceType === 'file') {
                            let dataDirectory = packageResourceLocator.getDataDirectory();
                            let binaryFilePath = path.join(dataDirectory, detail.binarySourceFilePath);

                            // https://nodejs.org/api/fs.html#fs_fspromises_readfile_path_options
                            try {
                                value = await fsPromise.readFile(binaryFilePath);
                            } catch (err) {
                                throw new IOException(
                                    `Can not read file: "${detail.binarySourceFilePath}".`, err);
                            }

                        } else {
                            throw new ParseException(
                                `Unknown parameter binary source type: ${binarySourceType}.`);
                        }
                        break;
                    }
            }

            // 完成一项的解析
            parameters[key] = value;
        }

        return parameters;
    }
}

module.exports = ConfigParameterResolver;
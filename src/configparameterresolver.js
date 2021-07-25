const path = require('path');
const fsPromise = require('fs/promises');

const { Buffer } = require('buffer');

const { ParseException, IOException, FileNotFoundException } = require('jsexception');
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
 *
 * - option
 *   详细信息会有
 *   valueOptions: [item1, item2, ...]
 *   表示可选取的候选值，一般为数字类型的数组
 *
 * - object
 *   详细信息会有：
 *   - objectSourceType: config|file
 *   - objectSourceFilePath: fileName
 *   objectSourceType 表示对象源，可以是在当前配置文件本身，也可以是指定的
 *   一个外部文件。
 *   objectSourceFilePath 是一个相对路径，表示位于项目的 data 文件夹之内的
 *   一个文件，文件格式必须是 YAML。
 *   object 类型的参数值是单纯一个数字无法表示的值，比如一个 LUT（查找表）的
 *   内容，是一个数据表格（Data table），它需要使用 object 类型来表示。
 *
 * - binary
 *   详细信息会有：
 *   - binarySourceType: config|file
 *   - binarySourceFilePath: fileName
 *   binarySourceType 表示对象源，可以是在当前配置文件本身，即详细信息中的
 *   value 属性的值，为一个字节数组的 hex 编码的字符串，也可以是指定的
 *   一个外部文件。
 *   binarySourceFilePath 是一个相对路径，表示位于项目的 data 文件夹之内的
 *   一个文件，文件可以是任何格式，参数加载器会读入文件并且以
 *   字节数组（Nodejs 的 Buffer 对象，Uint8Array 的派生对象）的形式储存。
 *   https://nodejs.org/api/buffer.html
 *   https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array
 *   binary 类型的参数一般用于诸如 ROM 的原始数据。
 */
class ConfigParameterResolver {

    /**
     * 将配置文件里的 parameters 转换成逻辑模块所使用的 parameters 对象。
     *
     * - 如果配置值超出 range 范围，则抛出 ParseException 异常。
     * - 如果指定对象文件解析错误，则抛出 ParseException 异常。
     * - 如果指定对象文件内容为空或者无实际数据，则抛出 ParseException 异常。
     * - 如果指定的对象/二进制文件不存在，则抛出 FileNotFoundException 异常。
     * - 如果指定的对象/二进制文件读取错误，则抛出 IOException 异常。
     *
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
                        // 示例：
                        // {
                        //     valueType: 'number',
                        //     value: Number
                        // }

                        value = detail.value;
                        break;
                    }

                case ConfigParameterValueType.range:
                    {
                        // 示例：
                        // {
                        //     valueType: 'range',
                        //     value: Number,
                        //     valueRange: {
                        //         from: Number,
                        //         to: Number
                        //     }
                        // }

                        value = detail.value;
                        let valueRange = detail.valueRange;
                        let from = valueRange.from;
                        let to = valueRange.to;

                        if (value < from || value > to) {
                            throw new ParseException(
                                `Parameter "${key}" value out of range.`);
                        }
                        break;
                    }

                case ConfigParameterValueType.option:
                    {
                        // 示例：
                        // {
                        //     valueType: 'option',
                        //     value: Number,
                        //     valueOptions: [Number, Number, ...]
                        // }

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
                        // 示例：
                        // {
                        //     valueType: 'object',
                        //     objectSourceType: 'config',
                        //     value: {
                        //         someKey: 'someValue',
                        //         ...
                        //     }
                        // }
                        //
                        // 或者
                        //
                        // {
                        //     valueType: 'object',
                        //     objectSourceType: 'file',
                        //     objectSourceFilePath: 'file_name.yaml'
                        // }

                        let objectSourceType = detail.objectSourceType;
                        if (objectSourceType === 'config') {
                            value = detail.value;
                        } else if (objectSourceType === 'file') {
                            let dataDirectory = packageResourceLocator.getDataDirectory();
                            let objectFilePath = path.join(dataDirectory, detail.objectSourceFilePath);
                            let fileConfig = new YAMLFileConfig();
                            let promiseFileConfig = new PromiseFileConfig(fileConfig);

                            // 如果文件内容为空，value 的值为 undefined
                            // 如果文件无实际数据，value 的值为 null
                            value = await promiseFileConfig.load(objectFilePath);

                            if (value === undefined || value === null) {
                                throw new ParseException(
                                    `Parameter object source file is empty: ${objectFilePath}.`);
                            }

                        } else {
                            throw new ParseException(
                                `Unknown parameter object source type: ${objectSourceType}.`);
                        }
                        break;
                    }

                case ConfigParameterValueType.binary:
                    {
                        // 示例：
                        // {
                        //     valueType: 'binary',
                        //     binarySourceType: 'config',
                        //     value: '68656c6c6f'
                        // }
                        //
                        // 或者
                        //
                        // {
                        //     valueType: 'binary',
                        //     binarySourceType: 'file',
                        //     binarySourceFilePath: 'file_name.bin'
                        // }

                        let buffer;
                        let binarySourceType = detail.binarySourceType;
                        if (binarySourceType === 'config') {
                            // https://nodejs.org/api/buffer.html#buffer_static_method_buffer_from_string_encoding
                            buffer = Buffer.from(detail.value, 'hex');

                        } else if (binarySourceType === 'file') {
                            let dataDirectory = packageResourceLocator.getDataDirectory();
                            let binaryFilePath = path.join(dataDirectory, detail.binarySourceFilePath);

                            // https://nodejs.org/api/fs.html#fs_fspromises_readfile_path_options
                            try {
                                buffer = await fsPromise.readFile(binaryFilePath);
                            } catch (err) {
                                if (err.code === 'ENOENT') {
                                    throw new FileNotFoundException(
                                        `Can not find the specified file: "${binaryFilePath}"`, err);

                                } else {
                                    throw new IOException(
                                        `Can not read file: "${binaryFilePath}".`, err);
                                }

                            }

                        } else {
                            throw new ParseException(
                                `Unknown parameter binary source type: ${binarySourceType}.`);
                        }

                        value = buffer;
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
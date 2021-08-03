const path = require('path');
const fsPromise = require('fs/promises');
const { Buffer } = require('buffer');

const { ParseException, IllegalArgumentException, IOException, FileNotFoundException } = require('jsexception');
const { PromiseFileConfig, YAMLFileConfig } = require('jsfileconfig');

const ConfigParameterValueType = require('./configparametervaluetype');

/**
 * 配置文件里面的 parameters 属性有两种，一种是模块的默认属性（defaultParameters），一种
 * 是子模块的实例属性（即子模块的 parameters）。
 *
 * ## 默认属性 defaultParameters
 *
 * defaultParameters 属性的值是一个 Map，结构如下：
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
 * - number，表示值是任意数字
 * - boolean，表示值是布尔型（即 true 或者 false）
 * - string，表示值是字符串类型
 * - range，表示值是一个某个范围的数字
 * - option，表示值只能是候选值当中的一个
 * - object，表示值是一个对象（一个纯数据对象或者一个数组）
 * - binary，表示值是一个二进制数据
 *
 * 当 valueType 的值不同时，paramater 的详细信息结构也
 * 不同，比如当 valueType 为：
 * - string
 *   详细信息会有
 *   minLength: Number
 *   表示允许字符串的最小长度，默认值为 0
 *   maxLength: Number
 *   表示允许字符串的最大长度，默认值为 0，表示不限制最大长度
 *
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
 *
 * ## 子模块实例属性 parameters
 *
 * parameters 属性的值是一个 Map，结构如下：
 * {
 *   param_name_1: value1,
 *   param_name_2: value2,
 *   param_name_3: object(file:file_name.yaml)
 *   param_name_4: binary(file:file_name.bin)
 *   ...
 * }
 *
 * 属性值可以是数字、布尔值、字符串，对象，也可以是一个从外部文件获取的对象或者字节数组。当属性值从
 * 外部文件读取时，需指定外部文件的路径，路径必须是一个相对于项目的 data 文件夹的相对路径。
 */
class ConfigParameterResolver {

    /**
     * 将配置文件里的 parameters 转换成逻辑模块所使用的 parameters 对象。
     *
     * - 如果配置值超出 range 范围，则抛出 IllegalArgumentException 异常。
     * - 如果指定对象文件解析错误，则抛出 ParseException 异常。
     * - 如果指定对象文件内容为空或者无实际数据，则抛出 IllegalArgumentException 异常。
     * - 如果指定的对象/二进制文件不存在，则抛出 FileNotFoundException 异常。
     * - 如果指定的对象/二进制文件读取错误，则抛出 IOException 异常。
     *
     * @param {*} configParameters
     * @param {*} packageResourceLocator
     * @returns
     */
    static async resolveDefaultParameters(configParameters, packageResourceLocator) {
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

                case ConfigParameterValueType.boolean:
                    {
                        // 示例：
                        // {
                        //     valueType: 'boolean',
                        //     value: true
                        // }
                        value = detail.value;
                        if (typeof value !== 'boolean') {
                            throw new IllegalArgumentException(
                                `Parameter "${key}" should be a boolean.`);
                        }
                        break;
                    }

                case ConfigParameterValueType.string:
                    {
                        // 示例：
                        // {
                        //     valueType: 'string',
                        //     value: 'hello'
                        //     minLength: 5,
                        //     maxLength: 5
                        // }
                        value = detail.value;
                        if (typeof value !== 'string') {
                            throw new IllegalArgumentException(
                                `Parameter "${key}" should be a string.`);
                        }

                        let minLength = detail.minLength ?? 0;
                        let maxLength = detail.maxLength ?? 0;

                        if (value.length < minLength){
                            throw new IllegalArgumentException(
                                `The length of parameter "${key}" should equals or greater than ${minLength}.`);
                        }

                        if (maxLength > 0 && value.length > maxLength) {
                            throw new IllegalArgumentException(
                                `The length of parameter "${key}" should equals or less than ${maxLength}.`);
                        }
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
                            throw new IllegalArgumentException(
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
                            throw new IllegalArgumentException(
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
                                throw new IllegalArgumentException(
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

                default:
                    {
                        throw new ParseException(
                            `Unknown value type: ${valueType}.`);
                    }
            }

            // 完成一项的解析
            parameters[key] = value;
        }

        return parameters;
    }

    static resolveInstanceParameters(configParameters, parentConfigParameters) { //, packageResourceLocator) {
        // 先解析占位符
        configParameters = ConfigParameterResolver.resolveInheritedConfigParameters(
            configParameters, parentConfigParameters);

        return configParameters;

//         // 暂不支持外部文件的对象和字节数组：
//         let resolvedConfigParameters = {};
//
//         for(let key in configParameters) {
//             let value = configParameters[key];
//
//             // 解析 object(file:...) 以及 binary(file:...) 表达式
//             if (typeof value === 'string') {
//                 let match = /^(object|binary)\s*\((.+)\)$/.exec(value);
//                 if (match === null) {
//                     resolvedConfigParameters[key] = value;
//                     continue;
//                 }
//
//                 let sourceType = match[1];
//                 let sourcePath = match[2].trim();
//                 let dataDirectory = packageResourceLocator.getDataDirectory();
//
//                 resolvedConfigParameters[key] = await ConfigParameterResolver.resolveFileValue(
//                     sourceType, sourcePath, dataDirectory);
//
//             }else {
//                 resolvedConfigParameters[key] = value;
//             }
//         }
//
//         return resolvedConfigParameters;
    }

    static resolveInheritedConfigParameters(configParameters, parentConfigParameters) {
        let resolvedConfigParameters = {};
        for (let key in configParameters) {
            let value = configParameters[key];
            if (typeof value === 'string') {
                value = ConfigParameterResolver.resolveParameterValuePlaceholder(
                    value , parentConfigParameters);
            }
            resolvedConfigParameters[key] = value;
        }
        return resolvedConfigParameters;
    }

    /**
     * - 配置文件里各项的值有可能是一种占位符，表示从指定映射里获取真正的值。
     *   比如一个逻辑门的配置文件有一项 “bitWidth”，它的值可以：
     *   1. 直接写成 “8”，表示数字 “8”。
     *   2. 也可能不直接写值，而是写成 “${bitWidth}” 这样格式的占位符，
     *      表示从当前逻辑模块的默认配置（defaultParameters）里读取
     *      键为 “bitWidth” 的值。
     *
     * @param {*} stringValue
     * @param {*} parameters
     */
    static resolveParameterValuePlaceholder(stringValue, parameters) {
        let match = /^\${(.+)}$/.exec(stringValue); // 占位符的格式 ${placeholder}
        if (match !== null) {
            let placeholderName = match[1];
            return parameters[placeholderName];

        }else {
            return stringValue;
        }
    }

    /**
     * 解析诸如的头信息值：
     * - object(file:file_name.yaml)
     * - binary(file:file_name.bin)
     *
     * @param {*} sourceType
     * @param {*} sourcePath
     * @param {*} dataDirectory
     * @returns
     */
     static async resolveFileValue(sourceType, sourcePath, dataDirectory) {
        if (!sourcePath.startsWith('file:')) {
            throw new ParseException(
                `Unsupport source type for parameter: ${key}.`);
        }

        let sourceFileName = sourcePath.substring('file:'.length);
        let sourceFilePath = path.join(dataDirectory, sourceFileName);

        let sourceValue = await FrontMatterResolver.loadSourceFile(
            sourceType, sourceFilePath);

        return sourceValue;
    }

    static async loadSourceFile(sourceType, sourceFilePath) {
        if (sourceType === 'object') {
            return await FrontMatterResolver.loadObjectSourceFile(sourceFilePath);
        }else if(sourceType === 'binary') {
            return await FrontMatterResolver.loadBinarySourceFile(sourceFilePath);
        }
    }

    /**
     * - 如果 YAML 对象文件解析失败，会抛出 ParseException。
     * - 如果文件内容为空或者无实际数据，会抛出 ScriptParseException。
     * - 如果文件不存在，则抛出 FileNotFoundException 异常。
     * - 如果读取文件失败，则抛出 IOException 异常。
     *
     * @param {*} sourceFilePath
     * @returns 一个数据对象或者数据数组，
     */
    static async loadObjectSourceFile(sourceFilePath) {
        let fileConfig = new YAMLFileConfig();
        let promiseFileConfig = new PromiseFileConfig(fileConfig);

        // 如果文件内容为空，value 的值为 undefined
        // 如果文件无实际数据，value 的值为 null
        let config = await promiseFileConfig.load(sourceFilePath);

        if (config === undefined || config === null) {
            throw new ParseException(
                `The object source file "${sourceFilePath}" is empty.`);
        }

        return config;
    }

    /**
     * - 如果文件不存在，则抛出 FileNotFoundException 异常。
     * - 如果读取文件失败，则抛出 IOException 异常。
     * @param {*} sourceFilePath
     * @returns Nodejs 的 Buffer 对象
     */
    static async loadBinarySourceFile(sourceFilePath) {
        // https://nodejs.org/api/fs.html#fs_fspromises_readfile_path_options
        try {
            return await fsPromise.readFile(sourceFilePath);
        } catch (err) {
            if (err.code === 'ENOENT') {
                throw new FileNotFoundException(
                    `Can not find the specified file: "${sourceFilePath}"`, err);

            }else {
                throw new IOException(
                    `Can not read file: "${sourceFilePath}".`, err);
            }
        }
    }
}

module.exports = ConfigParameterResolver;
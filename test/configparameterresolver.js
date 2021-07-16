const path = require('path');
const assert = require('assert/strict');

const { ParseException, IOException, FileNotFoundException } = require('jsexception');
const { ObjectUtils } = require('jsobjectutils');

const {
    PackageRepositoryManager,
    PackageResourceLocator,
    ConfigParameterResolver,
    ConfigParameterValueType
} = require('../index');

describe('Test ConfigParameterResolver', () => {
    it('Test "number/range/option" value type', async () => {
        let configParameters1 = {
            key1: {
                valueType: ConfigParameterValueType.number,
                value: 123
            },
            key2: {
                valueType: ConfigParameterValueType.range,
                value: 4,
                valueRange: {
                    from: 1,
                    to: 8
                }
            },
            key3: {
                valueType: ConfigParameterValueType.option,
                value: 12,
                valueOptions: [11, 12, 13, 14]
            }
        }

        let parameters1 = await ConfigParameterResolver.resolve(configParameters1);
        assert(ObjectUtils.objectEquals(parameters1, {
            key1: 123,
            key2: 4,
            key3: 12
        }));

        // 测试 valueType 为 range 类型的错误
        let configParameters2 = {
            key2: {
                valueType: ConfigParameterValueType.range,
                value: 12,
                valueRange: {
                    from: 1,
                    to: 8
                }
            }
        }

        try {
            await ConfigParameterResolver.resolve(configParameters2);
            assert.fail();
        } catch (err) {
            assert(err instanceof ParseException);
        }

        // 测试 valueType 为 option 类型的错误
        let configParameters3 = {
            key3: {
                valueType: ConfigParameterValueType.option,
                value: 16,
                valueOptions: [11, 12, 13, 14]
            }
        }

        try {
            await ConfigParameterResolver.resolve(configParameters3);
            assert.fail();
        } catch (err) {
            assert(err instanceof ParseException);
        }
    });

    it('Test "object" value type', async () => {
        let testDirectory = __dirname;
        let resourceDirectory = path.join(testDirectory, 'resources');
        let repositoryPath1 = path.join(resourceDirectory, 'package-repository-1');
        let packagePath1 = path.join(repositoryPath1, 'sample-package');

        let packageResourceLocator1 = PackageResourceLocator.create(packagePath1);

        let configParameters1 = {
            key1: {
                valueType: ConfigParameterValueType.object,
                objectSourceType: 'config',
                value: {
                    someKey: 'someValue'
                }
            }
        }

        let parameters1 = await ConfigParameterResolver.resolve(configParameters1);

        assert(ObjectUtils.objectEquals(parameters1,{
            key1: {
                someKey: 'someValue'
            }
        }));

        // 测试 object 为外部文件
        let configParameters2 = {
            key2: {
                valueType: ConfigParameterValueType.object,
                objectSourceType: 'file',
                objectSourceFilePath: 'sample.yaml'
            }
        }

        let parameters2 = await ConfigParameterResolver.resolve(configParameters2, packageResourceLocator1);

        assert(ObjectUtils.objectEquals(parameters2,{
            key2: [
                { address: 0, value: 0 },
                { address: 1, value: 0 },
                { address: 2, value: 0 },
                { address: 3, value: 1 }
            ]
        }));

        // 测试 object 为外部文件 - 文件不存在的情况

        let configParameters3 = {
            key3: {
                valueType: ConfigParameterValueType.object,
                objectSourceType: 'file',
                objectSourceFilePath: 'no-this-file.yaml'
            }
        }

        let parameters3 = await ConfigParameterResolver.resolve(configParameters3, packageResourceLocator1);
        assert(parameters3.key3 === undefined);
    });

    it('Test "binary" value type', async () => {
        let testDirectory = __dirname;
        let resourceDirectory = path.join(testDirectory, 'resources');
        let repositoryPath1 = path.join(resourceDirectory, 'package-repository-1');
        let packagePath1 = path.join(repositoryPath1, 'sample-package');

        let packageResourceLocator1 = PackageResourceLocator.create(packagePath1);

        let configParameters1 = {
            key1: {
                valueType: ConfigParameterValueType.binary,
                binarySourceType: 'config',
                value: '68656c6c6f'
            }
        }

        let parameters1 = await ConfigParameterResolver.resolve(configParameters1);
        let buffer1 = parameters1.key1;
        assert.equal(5, buffer1.length);
        assert.equal('hello', buffer1.toString('utf-8'));

        // 测试 object 为外部文件
        let configParameters2 = {
            key2: {
                valueType: ConfigParameterValueType.binary,
                binarySourceType: 'file',
                binarySourceFilePath: 'sample.bin'
            }
        }

        let parameters2 = await ConfigParameterResolver.resolve(configParameters2, packageResourceLocator1);
        let buffer2 = parameters2.key2;
        assert.equal(5, buffer2.length);
        assert.equal('hello', buffer2.toString('utf-8'));

        // 测试 object 为外部文件 - 文件不存在的情况

        let configParameters3 = {
            key3: {
                valueType: ConfigParameterValueType.binary,
                binarySourceType: 'file',
                binarySourceFilePath: 'no-this-file.yaml'
            }
        }

        try{
            await ConfigParameterResolver.resolve(configParameters3, packageResourceLocator1);
            assert.fail();
        }catch(err){
            assert(err instanceof FileNotFoundException);
        }
    });
});
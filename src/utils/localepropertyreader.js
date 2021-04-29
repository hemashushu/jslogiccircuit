class LocalePropertyReader {

    /**
     * 读取本地化的配置文件的指定字段的文本。
     *
     * @param {*} localeCode 诸如 'zh_CN', 'en_US', 'jp' 等 Locale ID (LCID)
     */
    static getValue(config, propertyName, localeCode) {

        // 示例：
        //
        // 假设有如下本地化的配置文件，准备读取 "Comment" 字段的文本：
        //
        // Comment[en_GB]=Edit text files               ... #1
        // Comment[zh_CN]=编辑文本文件                   ... #2
        // Comment[zh_TW]=編輯文字檔                     ... #3
        // Comment[ja]=テキストファイルを編集します        ... #4
        // Comment=Edit text files                      ... #5
        //
        // 当 localeCode 为 zh_CN 时，该方法会读取第 2 行的文本
        // 当 localeCode 为 kr 时，该方法会读取默认的（即第 5 行）文本。


        // 将 'en-US' 中间的连接符号统一转换为 '_'
        localeCode = localeCode.replace('-', '_');

        // 尝试准确匹配
        let value = config[`${propertyName}[${localeCode}]`];
        if (value !== undefined) {
            return value;
        }

        // 尝试模糊匹配
        let pos = localeCode.indexOf('_');
        if (pos > 0) {
            let languageCode = localeCode.substring(0, pos);
            value = config[`${propertyName}[${languageCode}]`];
            if (value !== undefined) {
                return value;
            }
        }

        return config[propertyName];
    }
}

module.exports = LocalePropertyReader;
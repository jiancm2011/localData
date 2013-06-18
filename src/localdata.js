/**
 * LocalData v0.4.0
 * 一个结构化localStorage数据的简易操作库
 * Author: Maple Jan
 * E-mail: jiancm2001@gmail.com
 * Date: 13-06-18
 */

(function (W) {

    var isDebug = true;

    function debug(command, str) {
        debug = function () {};
        if (isDebug) {
            debug = function (command, str) {
                W.console[command]("LocalData " + command.charAt(0).toUpperCase() + command.slice(1) + ": " + str);
            };
        }
        debug(command, str)
    }

    function throwError(str) {
        throw new Error(str);
    }

    function type(obj) {
        var typeArr = "Boolean Number String Function Array Date RegExp Object Error".split(" "),
            typeObj = {},
            toStr = typeObj.toString;

        for (var i = 0, l = typeArr.length; i < l; i++) {
            var name = typeArr[i];
            typeObj[ "[object " + name + "]" ] = name.toLowerCase();
        }

        type = function (obj) {
            if (obj === null) {
                return String(obj);
            }
            return typeof obj === "object" || typeof obj === "function" ?
                typeObj[toStr.call(obj)] || "object" : typeof obj;
        };
        return type(obj);
    }

    function extend(target) {
        [].slice.call(arguments, 1).forEach(function (source) {
            for (var key in source) {
                if (source[key] !== undefined) {
                    target[key] = source[key];
                }
            }
        });
        return target;
    }

    function isObject(obj) { return type(obj) === "object"; }
    function isArray(obj) { return type(obj) === "array"; }
    function isString(obj) { return type(obj) === "string"; }
    function isNumber(obj) { return type(obj) === "number"; }

    // TODO 测试用
    /*extend(W, {
        debug: debug,
        type: type,
        extend: extend,
    });*/

    /**
     * @class LocalData
     */
    function LocalData(config) {

        /**
         * 用于存储复杂的表名
         * @type Object
         */
        this.item = {};

        // 初始化
        (function init(self, config) {
            if (config && isObject(config)) {
                self.item = config;
            } else {
                debug("warn", "@param config is not a object");
            }
            return self;
        })(this, config);
    }

    extend(LocalData.prototype, {

        /**
         * 创健一个localStorage的item
         * create(table[, dataObj[, isEnforce]])
         * @param {String} table 表名
         * @param dataObj 数据对象
         * @param isEnforce 是否强行创建
         * @returns {Boolean}
         */
        create: function (table, dataObj, isEnforce) {
            if (!isEnforce && localStorage[table] !== undefined && localStorage[table].length) {
                debug("warn", "localStorage[\"" + table + "\"] is created");
                return false;
            }
            if (arguments[1]) {
                localStorage[table] = JSON.stringify(arguments[1]);
            } else {
                localStorage[table] = "[]";
            }
            return true;
        },

        /**
         * 查找localStorage中指定item的匹配属性
         * select(table, selector)
         * @param {String} table 表名
         * @param selector 选择器
         */
        select: function (table, selector) {

            var data = localStorage[table];

            if (data === undefined || !data.length) {
                debug("warn", "localStorage." + table + " is undefined or null");
                return data;
            }

            data = JSON.parse(data);

            var result = [[], []]; // result[0]为item数据, result[1]为对应item数据列表中的位置

            if (selector === "*" || selector === undefined) {
                result[0] = data;
                data.forEach(function (val, key) {
                    result[1].push(key);
                });
            }
            // selector为Number类型
            else if (isNumber(selector)) {
                if (selector < data.length) {
                    result[0].push(data[selector]);
                    result[1].push(selector);
                }
            }
            // selector为Array类型
            else if (isArray(selector)) {
                selector.forEach(function (val, key) {
                    if (val < data.length) {
                        result[0].push(data[val]);
                        result[1].push(val);
                    }
                });
            }
            // selector为 String类型 或 Object类型
            else if (isString(selector) || isObject(selector)) {
                var selectorArr = [],
                    index = "",
                    value = "",
                    arr1 = [],
                    arr2 = [];

                if (isObject(selector)) {
                    for (var key in selector) {
                        if(selector.hasOwnProperty(key)) {
                            selectorArr.push(key + "=" + selector[key]);
                        }
                    }
                } else {
                    selectorArr = selector.replace(/\s/g, "").split(",")
                }

                for (var i = 0, len = selectorArr.length; i < len; i++) {
                    var val = selectorArr[i],
                        key = i;
                    if (!val.match(/^\w+=\w+$/)) {
                        debug("error", "@param selector is error");
                        break;
                    }
                    index = val.split("=")[0];
                    value = val.split("=")[1];
                    if (key === 0) {
                        data.forEach(function (val, key) {
                            if (val[index] == value) {
                                arr1.push(key);
                            }
                        });
                    } else {
                        arr1.forEach(function (val, key) {
                            if (data[val][index] == value) {
                                arr2.push(val);
                            }
                        });
                        arr1 = arr2;
                        arr2 = [];
                    }
                }
                arr1.forEach(function (val, key) {
                    result[0].push(data[val]);
                });
                result[1] = arr1;
            }
            return result;
        },

        /**
         * 删除localStorage中指定item的匹配属性
         * remove(table, selector)
         * @param {String} table 表名
         * @param selector 选择器
         * @returns {Boolean}
         */
        remove: function (table, selector) {
            var data = this.select(table, selector);
            console.log(data);

            // localStorage存在该条item，但其为空，则直接删除整条item
            if (selector === "*" || selector === undefined) {
                localStorage.removeItem(table);
            }
            // localStorage不存在该条item 或者 没有匹配任何数据
            else if (data === undefined || data[0].length === 0) {
                return false;
            }
            else {
                var arr = [];
                // selector为Number类型
                if (isNumber(selector)) {
                    arr.push(selector);
                }
                // selector为Array类型
                else if (isArray(selector)) {
                    arr = selector;
                }
                // selector为String类型
                else if (isString(selector)) {
                    arr = data[1];
                }
                data = this.select(table)[0];
                arr.forEach(function (val, key){
                    var num = val - key;
                    data.splice(num, 1);
                });
                localStorage[table] = JSON.stringify(data);
            }
            return true;
        },

        /**
         * 向localStorage中指定的item插入数据
         * insert(table, obj)
         * @param {String} table 表名
         * @param obj 更新数据
         * @returns {Boolean}
         */
        insert: function (table, obj) {
            var data = this.select(table);
            if (data === undefined) {
                return false;
            }
            if (obj.push) {
                obj.forEach(function (val, key) {
                    data[0].push(val);
                });
            } else {
                data[0].push(obj);
            }
            localStorage[table] = JSON.stringify(data[0]);
            return true;
        },

        /**
         * 更新localStorage中指定的item中的指定数据
         * update(table, selector, obj)
         * @param {String} table 表名
         * @param selector 选择器
         * @param obj 更新数据
         * @returns {Boolean}
         */
        update: function (table, selector, obj) {
            var data = JSON.parse(localStorage[table]),
                result = this.select(table, selector);
            if (result[1].length > 1) {
                debug("error", "match selector is more than one");
                return false;
            }
            var key = result[1][0];
            // obj为Object类型
            if (isObject(obj)) {
                extend(data[key], obj);
            } else {
                data[key] = obj;
            }
            localStorage[table] = JSON.stringify(data);
            return true;
        }

    });

    W.LocalData = LocalData;

})(window);
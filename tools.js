const fs = require('fs');

const getTagName = (component_name) => {
    return component_name
        .replace(/^(.*?)Component$/, '$1')
        .replace(/([A-Z])/g, '-$1')
        .substring(1)
        .toLowerCase();
};

/**
 * execute calllback in next js cycle
 * @param {Function} callback
 * @returns {Promise} resolve value returned by callback()
 */
 const nextCycle = (callback) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            let res = null;
            try {
                if (callback instanceof Function) {
                    res = callback();
                } else {
                    throw new Error('argument callback is not a function');
                }
            } catch (err) {
                return reject(err);
            }
            return resolve(res);
        });
    });
};


/**
 * read file and return a promise
 * @param {String} filePath file path
 * @param {String} isRelativePath is file path relative or not ? default false
 * @param {String} encoding encoding format to read the file, default utf-8
 * @returns {Promise} resolve file content
 */
const readFile = (filePath, encoding = 'utf-8') => {
    return new Promise((resolve, reject) => {
        fs.access(filePath, (err) => {
            if (err) {
                resolve('');
            } else {
                fs.readFile(filePath, encoding, (err, data) => {
                    err ? reject(err) : resolve(data);
                });
            }
        });
    });
};

module.exports = {
    getTagName,
    nextCycle,
    readFile
};

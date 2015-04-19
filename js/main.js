/****************************IndexedDB  操作***************************/


/**
 * [dbInitiate 初始化数据库]
 * @param  name       [数据库名称]
 * @param  db_version [数据库版本号]
 */
function dbInitiate(name, db_version) {
	var version = (db_version || 1);
	/**
	 * 打开数据库，如果该数据库不存在则新建一个
	 * @param1 name       [数据库名称]
	 * @param2 version    [数据库版本号]
	 */
	var request = window.indexedDB.open(name, version);
	request.onerror = onOpenError;
	request.onsuccess = function(e) {
		console.log(e.target.result);
	};
	/**
	 * [onupgradeneeded 数据库版本升级的回调函数]
	 */
	request.onupgradeneeded = function(e) {
		var db = e.target.result;
		if (!db.objectStoreNames.contains('files')) {
			/**
			 * 在数据库中新建一个ObjectStore
			 * 类似于一张表
			 * @param1 ObjectStore的名称
			 * @param2 指定关键字
			 * [keyPath 关键字]
			 */
			db.createObjectStore('files', {
				keyPath: "id"
			});
		}
		console.log('DB version changed to ' + version);
	};
}


/**
 * [addFile 向数据库中插入一条记录]
 * @param file [记录]
 */
function addFile(file) {
	var request = window.indexedDB.open("fileDB", 2);
	request.onsuccess = function(e) {
		var db = e.target.result;
		var transaction = db.transaction("files", 'readwrite');
		var store = transaction.objectStore("files");
		var request = store.put(file);
		request.onsuccess = function(e) {
			console.log("Pushing file successfully!");
		};
		request.onerror = function(e) {
			console.log("Pushing file error:" + e.currentTarget.error.message);
		};
	};
	request.onerror = onOpenError;
}

/**
 * [getFile 从数据库中读出记录]
 * @param  {[type]} id [记录id]
 */
function getFile(id) {
	var request = window.indexedDB.open("fileDB", 2);
	request.onerror = function(e) {
		console.log(e.currentTarget.error.message);
	};
	request.onsuccess = function(e) {
		var db = e.target.result;
		var transaction = db.transaction("files", window.IDBTransaction.READ_ONLY);
		var store = transaction.objectStore("files");
		var request = store.get(id);
		request.onsuccess = function(e) {
			var file = e.target.result;
			downloadFile(file.data, file.name);
		};
	};
}

/**
 * [downloadFile 下载文件]
 * @param  {[type]} content  [文件的DataURL]
 * @param  {[type]} fileName [文件名]
 */
function downloadFile(content, fileName) {
	var aLink = document.createElement('a');
	var blob = dataURLtoBlob(content);
	var evt = document.createEvent("HTMLEvents");
	evt.initEvent("click", false, false);
	aLink.download = fileName;
	aLink.href = URL.createObjectURL(blob);
	aLink.dispatchEvent(evt);
}




/**
 * [dataURLtoBlob 将DataURL转换为Blob类型]
 * @param  dataURL
 */
function dataURLtoBlob(dataURL) {
	// convert base64/URLEncoded data component to raw binary data held in a string
	var byteString;
	if (dataURL.split(',')[0].indexOf('base64') >= 0)
		byteString = atob(dataURL.split(',')[1]);
	else
		byteString = unescape(dataURL.split(',')[1]);
	// separate out the mime component
	var mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
	// write the bytes of the string to a typed array
	var ia = new Uint8Array(byteString.length);
	for (var i = 0; i < byteString.length; i++) {
		ia[i] = byteString.charCodeAt(i);
	}
	return new Blob([ia], {
		type: mimeString
	});
}

/**
 * [refreshFileList 刷新文件列表]
 */
function refreshFileList() {
	$("#file-list").empty();
	var request = window.indexedDB.open("fileDB", 2);
	request.onerror = onOpenError;
	request.onsuccess = function(e) {
		var db = e.target.result;
		var transaction = db.transaction("files", window.IDBTransaction.READ_ONLY);
		var store = transaction.objectStore("files");
		var request = store.openCursor();
		request.onerror = function(e) {
			console.log("Creating cursor failed : " + e.currentTarget.error.message);
		};
		request.onsuccess = function(e) {
			var cursor = e.target.result;
			if (cursor) {
				var info = cursor.value;
				$("#file-list").append("<option value=" + cursor.key + ">" +
					info.name + "\t" + Math.round(info.size / 1024 / 1024 * 100) / 100 + "MB\t" +
					info.date + "</option>");
				//console.log("Key: " + cursor.key + ", Value: " + JSON.stringify(cursor.value));
				cursor.continue();
			}
		};
	};
}

/**
 * [deleteFile 按id删除记录]
 * @param  id
 */
function deleteFile(id) {
	var request = window.indexedDB.open("fileDB", 2);
	request.onerror = function(e) {
		console.log(e.currentTarget.error.message);
	};
	request.onsuccess = function(e) {
		var db = e.target.result;
		var transaction = db.transaction("files", 'readwrite');
		var store = transaction.objectStore("files");
		var request = store.delete(id);
		request.onsuccess = function(e) {
			console.log("Delete file successfully!");
		};
		request.onerror = function(e) {
			console.log("Delete file error :" + e.currentTarget.error.message);
		};
	};
}

/**
 * [clearAllFiles 删除所有记录]
 */
function clearAllFiles() {
	var request = window.indexedDB.open("fileDB", 2);
	request.onerror = function(e) {
		console.log(e.currentTarget.error.message);
	};
	request.onsuccess = function(e) {
		var db = e.target.result;
		var transaction = db.transaction("files", 'readwrite');
		var store = transaction.objectStore("files");
		var request = store.clear();
		request.onsuccess = function(e) {
			console.log("Clear file successfully!");
		};
		request.onerror = function(e) {
			console.log("Clear file error :" + e.currentTarget.error.message);
		};
	};
}

/**
 * [onOpenError 打开数据库错误的回调函数]
 */
function onOpenError(e) {
	console.log("Open indexedDB error :" + e.currentTarget.error.message);
}


/****************************事件********************************/

dbInitiate("fileDB", 2);
refreshFileList();

$(function() {
	$("#file-storge").click(function() {
		var input = document.getElementById("file-input").files[0];
		if (!input) {
			alert("please select a file!");
		} else {
			var reader = new window.FileReader(input);
			reader.readAsDataURL(input);
			reader.onload = function(e) {
				var file = {
					id: new Date().getTime(),
					name: input.name,
					type: input.type,
					size: input.size,
					date: new Date(),
					data: e.target.result
				};
				addFile(file);
				refreshFileList();
			};
		}
	});
});

$(function() {
	$("#button-download").click(function() {
		var id = $("#file-list").val();
		getFile(parseInt(id));
	});
});

$(function() {
	$("#button-delete").click(function() {
		var id = $("#file-list").val();
		deleteFile(parseInt(id));
		refreshFileList();
	});
});

$(function() {
	$("#button-clear-all").click(function() {
		clearAllFiles();
		refreshFileList();
	});
});

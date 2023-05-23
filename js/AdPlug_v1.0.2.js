var adPlug = new Object();

adPlug.fingerprint = "resources/unvip/fingerprint.js";
//TO-DO: Change domain
adPlug.domain = "https://color.quwin.cn/clad/";
// adPlug.domain = "http://localhost:9091/";
adPlug.uid = "";
adPlug.isShow = false;
adPlug.clickId;
adPlug.adPosition; //当前广告位, ad_index、ad_success、ad_fail
adPlug.extendInfo; //当广告不能展示的时候的展示信息，目前用于ad_index广告位
adPlug.phone = "";
adPlug.qwplid = "";
adPlug.queryString = "";
adPlug.init = function() {};

//初始化帆布指纹
adPlug.initFingerPrint = function() {
	adPlug.jsLoader.load(adPlug.fingerprint, function() {
		var fingerprint = new Fingerprint({
			canvas: true
		}).get();
		adPlug.uid = fingerprint;
		adPlug.cookie.setStorage(adPlug.userKey, fingerprint);
		adPlug.cookie.setCookie(adPlug.userKey, fingerprint);
		adPlug.jsLoader.removeScript('qw_fp_script')
	}, "utf-8", "qw_fp_script");
};
//cookie存取
adPlug.cookie = {
	setCookie: function(name, value, expires) {
		if (value) {
			var time = 0;
			if (expires) {
				time = expires;
			} else {
				var days = 100; //定义一天
				time = days * 24 * 60 * 60 * 1000;
			}
			var exp = new Date();
			exp.setTime(exp.getTime() + time);
			// 写入Cookie, toGMTString将时间转换成字符串
			document.cookie = name + "=" + escape(value) + ";expires=" + exp.toGMTString;
		}
	},
	getCookie: function(name) {
		var arr, reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)"); //匹配字段
		if (arr = document.cookie.match(reg)) {
			return unescape(arr[2]);
		} else {
			return null;
		}
	},
	setStorage: function(key, value) {
		if (typeof(Storage) !== "undefined") {
			localStorage.setItem(key, value);
			return true;
		} else {
			return false;
		}
	},
	getStorage: function(key) {
		if (typeof(Storage) !== "undefined") {
			return localStorage.getItem(key)
		} else {
			return null;
		}
	},
	setSessionStorage: function(key, value) {
		if (typeof(Storage) !== "undefined") {
			sessionStorage.setItem(key, value);
			return true;
		} else {
			return false;
		}
	},
	getSessionStorage: function(key) {
		if (typeof(Storage) !== "undefined") {
			return sessionStorage.getItem(key)
		} else {
			return null;
		}
	}
};
//浏览器判断
adPlug.Browser = {
	ie: /msie/.test(window.navigator.userAgent.toLowerCase()),
	moz: /gecko/.test(window.navigator.userAgent.toLowerCase()),
	opera: /opera/.test(window.navigator.userAgent.toLowerCase()),
	safari: /safari/.test(window.navigator.userAgent.toLowerCase())
};
//获取请求参数
adPlug.getQueryString = function(name) {
	var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
	var r = window.location.search.substr(1).match(reg);
	if (r != null) return unescape(r[2]);
	return null;
};

adPlug.getParam = function(paramName) {
	var query = window.location.hash;
	var vars = query.split("&");
	for (var i = 0; i < vars.length; i++) {
		var pair = vars[i].split("=");
		if (pair[0] == paramName) {
			return pair[1];
		}
	}
	return "";
}

//动态加载和移除JS
adPlug.jsLoader = {
	load: function(surl, fCallback, charset, id) {
		if (!surl || surl == '' || surl == null || surl == undefined) {
			return;
		}
		var _script = document.createElement('script');
		if (charset != null) {
			_script.setAttribute('charset', charset);
		}
		//_script.setAttribute('type', 'text/javascript');
		surl = surl.replace("#t#", parseInt(new Date() / 3600000));
		_script.setAttribute('src', surl);
		if (id != null) {
			_script.setAttribute("id", id);
		}
		document.getElementsByTagName('head')[0].appendChild(_script);
		//ie
		if (adPlug.Browser.ie) {
			_script.onreadystatechange = function() {
				if (this.readyState == 'loaded' || this.readyStaate == 'complete') {
					if (fCallback != undefined) {
						fCallback();
					}
				}
			};

		} else if (adPlug.Browser.moz) {
			_script.onload = function() {
				if (fCallback != undefined) {
					fCallback();
				}
			}
		} else {
			if (fCallback != undefined) {
				fCallback();
			}
		}
	},
	addScriptLabel: function(scriptLabel) {
		if (scriptLabel != '') {
			var _script = document.createElement('script');
			_script.setAttribute('type', 'text/javascript');
			_script.innerHTML = scriptLabel;
			document.getElementsByTagName('head')[0].appendChild(_script);
		}
	},
	removeScript: function(id) {
		document.getElementById(id).remove();
	},
	getUuid: function() {
		var userId = "";
		var userIdCookie = "";
		try {
			userId = adPlug.uid;
			if (!userId || userId == null || userId == undefined || userId == "") {
				userId = localStorage.getItem(adPlug.userKey);
			}
			if (!userId || userId == null || userId == undefined || userId == "") {
				userIdCookie = adPlug.cookie.getCookie(adPlug.userKey);
				userId = userIdCookie;
			}
			if (!userId || userId == null || userId == undefined || userId == "") {
				var timestamp = new Date().getTime()
				adPlug.uid = timestamp;
				userId = timestamp;
				if (window.localStorage && window.Storage && window.localStorage instanceof Storage) {
					localStorage.setItem(adPlug.userKey, timestamp);
				}
				adPlug.cookie.setCookie(adPlug.userKey, timestamp);
				return userId;
			}
		} catch (err) {
			console.error(err)
			var timestamp = new Date().getTime();
			return timestamp
		}
		return userId;
	}
};
//服务端相关
adPlug.ad = {
	setPhone: function(phone) {
		if (phone != null && phone != undefined) {
			adPlug.cookie.setStorage("qw_adplug_phone", phone);
		}
	},
	getPhone: function() {
		return adPlug.cookie.getStorage("qw_adplug_phone");
	},
	//从服务端加载渠道JS接口及方法
	getAd: function(isShow, phone, adPosition, extendInfo) {
		if (phone == undefined || phone == null || phone == '' || phone == 'null' || phone == 'undefined') {
			phone = adPlug.ad.getPhone();
		}

		adPlug.phone = phone;
		adPlug.isShow = isShow;
		adPlug.adPosition = adPosition;
		adPlug.extendInfo = extendInfo;
		let qwplid = adPlug.getQueryString('qwplid');
		var queryString = document.location.search;
		if (!queryString || queryString == '') {
			queryString = document.location.hash;
		}
		queryString = queryString.substr(queryString.indexOf("?") + 1, queryString.length);
		adPlug.queryString = queryString;
		if (!qwplid || qwplid == '') {
			qwplid = adPlug.getParam('qwplid');
		}
		if ((!qwplid || qwplid == '')) {
			console.error("参数错误");
			qwplid = 1000;
		}
		adPlug.qwplid = qwplid;
		var userId = adPlug.jsLoader.getUuid();
		adPlug.jsLoader.load(adPlug.domain + '/advert/get?callBack=adPlug.ad.create&qwplid=' + qwplid +
			'&adPosition=' + adPosition + "&phone=" + phone,
			function() {
				adPlug.jsLoader.removeScript('ad_getAd_script')
			}, "utf-8", "ad_getAd_script");
	},

	//首屏无广告时展示
	showNoAdIndex: function() {
		var addiv = document.createElement("div");
		addiv.id = "qwadadid_noindex";
		addiv.style.display = "block";
		addiv.style.position = "fixed";
		addiv.style.width = "100vw";
		addiv.style.height = "100vh";
		addiv.style.top = "0";
		addiv.style.left = "0";
		addiv.style.zIndex = "9999";
		addiv.style.backgroundColor = "rgba(0, 0, 0, 0.7)";

		var dialogBg = document.createElement("div");
		dialogBg.style.position = "absolute";
		dialogBg.style.width = "90%";
		dialogBg.style.height = "15rem";
		dialogBg.style.top = "20vh";
		dialogBg.style.left = "5%";
		dialogBg.style.backgroundImage = "url('../resources/ad_resource/ad_index_bg.png')";
		dialogBg.style.backgroundSize = "100% auto";
		dialogBg.style.backgroundRepeat = "no-repeat";
		dialogBg.style.textAlign = "center";
		dialogBg.style.paddingTop = "0.5rem";
		dialogBg.style.boxSizing = "border-box"

		var dialogInfo = document.createElement("div");
		dialogInfo.style.position = "absolute";
		dialogInfo.style.left = "15%";
		dialogInfo.style.bottom = "9rem";
		dialogInfo.style.height = "2rem";
		dialogInfo.style.width = "70%";
		dialogInfo.style.lineHeight = '0.8rem';
		dialogInfo.style.color = "#000";
		dialogInfo.style.fontSize = "0.7rem"
		dialogInfo.style.textAlign = "center"
		dialogInfo.innerText = adPlug.extendInfo;
		dialogBg.append(dialogInfo);

		var dialogClose = document.createElement("div");
		dialogClose.style.position = "absolute";
		dialogClose.style.left = "15%";
		dialogClose.style.bottom = "3rem";
		dialogClose.style.height = "2rem";
		dialogClose.style.width = "70%";
		dialogClose.style.lineHeight = '2rem';
		dialogClose.style.border = "1px solid #FFF"
		dialogClose.style.borderRadius = "2rem"
		dialogClose.style.color = "#FFF";
		dialogClose.style.backgroundColor = "rgba(0,0,0,0)";
		dialogClose.style.fontSize = "0.7rem"
		dialogClose.style.textAlign = "center"
		dialogClose.style.cursor = "pointer"
		dialogClose.innerText = "关闭"
		dialogClose.addEventListener("click", function() {
			$("#qwadadid_noindex").remove();
		})
		dialogBg.append(dialogClose);
		addiv.append(dialogBg);
		document.body.append(addiv)
	},

	//首屏广告
	showAdIndex: function(data) {
		// data.adText="0元领福利";
		var addiv = document.createElement("div");
		addiv.id = "qwadadid_index";
		addiv.style.display = "none";
		addiv.style.position = "fixed";
		addiv.style.width = "100vw";
		addiv.style.height = "100vh";
		addiv.style.top = "0";
		addiv.style.left = "0";
		addiv.style.zIndex = "9999";
		addiv.style.backgroundColor = "rgba(0, 0, 0,0.7)";

		var closeBnt = document.createElement("div");
		closeBnt.style.position = "absolute";
		closeBnt.style.width = "1.3rem";
		closeBnt.style.height = "1.3rem";
		closeBnt.style.top = "12vh";
		closeBnt.style.right = "1rem";
		closeBnt.style.backgroundImage = "url('../resources/ad_resource/close_bnt.png')";
		closeBnt.style.backgroundSize = "100% 100%";
		closeBnt.style.backgroundRepeat = "no-repeat";
		closeBnt.addEventListener("click", function() {
			addiv.remove()
		})
		addiv.append(closeBnt);

		var dialogBg = document.createElement("div");
		dialogBg.style.position = "absolute";
		dialogBg.style.width = "90%";
		dialogBg.style.height = "15rem";
		dialogBg.style.top = "22vh";
		dialogBg.style.left = "5%";
		dialogBg.style.backgroundImage = "url('../resources/ad_resource/ad_index_bg.png')";
		dialogBg.style.backgroundSize = "100% auto";
		dialogBg.style.backgroundRepeat = "no-repeat";
		dialogBg.style.textAlign = "center";
		dialogBg.style.paddingTop = "0.5rem";
		dialogBg.style.boxSizing = "border-box"

		var dialogInfo = document.createElement("div");
		dialogInfo.style.position = "absolute";
		dialogInfo.style.left = "15%";
		dialogInfo.style.bottom = "11.5rem";
		dialogInfo.style.height = "2rem";
		dialogInfo.style.width = "70%";
		dialogInfo.style.lineHeight = '0.8rem';
		dialogInfo.style.color = "#000";
		dialogInfo.style.fontSize = "0.7rem"
		dialogInfo.style.textAlign = "center"
		dialogInfo.innerText = adPlug.extendInfo;
		dialogBg.append(dialogInfo);

		var adImg = document.createElement("img");
		adImg.style.position = "absolute";
		adImg.style.left = "11%";
		adImg.style.bottom = "7.5rem";
		adImg.style.width = "80%";
		adImg.src = data.resourceFile;
		adImg.addEventListener("click", function() {
			adPlug.ad.onclick(data, adPlug.clickId);
		})
		dialogBg.append(adImg);

		var adBnt = document.createElement("div");
		adBnt.style.position = "absolute";
		adBnt.style.right = "10%";
		adBnt.style.bottom = "3rem";
		adBnt.style.height = "2rem";
		adBnt.style.width = "43%";
		adBnt.style.lineHeight = '2rem';
		adBnt.style.borderRadius = "2rem"
		adBnt.style.color = "#F91F02";
		adBnt.style.backgroundImage = "url('../resources/ad_resource/bnt_bg.png')";
		adBnt.style.backgroundSize = "100% 100%";
		adBnt.style.backgroundRepeat = "no-repeat";
		adBnt.style.cursor = "pointer"
		adBnt.style.fontSize = "0.7rem"
		adBnt.style.fontWeight = "bold"
		adBnt.style.textAlign = "center"
		adBnt.innerText = data.adText;
		adBnt.addEventListener("click", function() {
			adPlug.ad.onclick(data, adPlug.clickId);
		})
		dialogBg.append(adBnt);

		var dialogMore = document.createElement("div");
		dialogMore.style.position = "absolute";
		dialogMore.style.left = "10%";
		dialogMore.style.bottom = "3rem";
		dialogMore.style.height = "1.8rem";
		dialogMore.style.width = "25%";
		dialogMore.style.lineHeight = '1.8rem';
		dialogMore.style.border = "2px solid #FFF"
		dialogMore.style.borderRadius = "2rem"
		dialogMore.style.color = "#FFF";
		dialogMore.style.cursor = "pointer"
		dialogMore.style.backgroundColor = "rgba(0,0,0,0)";
		dialogMore.style.fontSize = "0.7rem"
		dialogMore.style.textAlign = "center"
		dialogMore.style.fontWeight = "bold";
		dialogMore.innerText = "更多"
		dialogMore.addEventListener("click", function() {
			adPlug.ad.onclick(data, adPlug.clickId);
		})
		dialogBg.append(dialogMore);

		var dialogPoint = document.createElement("div");
		dialogPoint.style.position = "absolute";
		dialogPoint.style.right = "0rem";
		dialogPoint.style.bottom = "1.5rem";
		dialogPoint.style.height = "2.8rem";
		dialogPoint.style.width = "4rem";
		dialogPoint.style.backgroundImage = "url('../resources/ad_resource/point.gif')";
		dialogPoint.style.backgroundSize = "100% auto";
		dialogPoint.style.backgroundRepeat = "no-repeat";
		dialogPoint.addEventListener("click", function() {
			adPlug.ad.onclick(data, adPlug.clickId);
		})
		dialogBg.append(dialogPoint);

		addiv.append(dialogBg);
		document.body.append(addiv)
		if (adPlug.isShow) {
			adPlug.ad.show('qwadadid_index', 'ad_index', data, adPlug.clickId);
		}
	},

	showAdSuccess: function(data) {
		var addiv = document.createElement("div");
		addiv.id = "qwadadid_success";
		addiv.style.display = "none";
		addiv.style.position = "fixed";
		addiv.style.width = "100vw";
		addiv.style.height = "100vh";
		addiv.style.top = "0";
		addiv.style.left = "0";
		addiv.style.zIndex = "9999";
		addiv.style.backgroundColor = "rgba(0, 0, 0, 0.7)";


		var imgBg = document.createElement("div");
		imgBg.style.position = "absolute";
		imgBg.style.width = "100%";
		imgBg.style.height = "20rem";
		imgBg.style.top = "10vh";
		imgBg.style.left = "0";
		/* imgBg.style.backgroundImage="url(https://down.quwin.cn/ad_resource/ad_plug_bg_v3.png)";
		imgBg.style.backgroundSize="100% 100%"; */
		// imgBg.style.backgroundColor="#000"
		imgBg.style.textAlign = "center";
		imgBg.style.paddingTop = "4.2rem";
		imgBg.style.boxSizing = "border-box"
		/* imgBg.addEventListener("click",function(){
			adPlug.ad.onclick(data,adPlug.clickId);
		}) */
		addiv.append(imgBg);


		var img = document.createElement("img");
		// img.style.position="absolute";
		img.style.width = "80%";
		img.style.height = "auto";
		img.style.minHeight = "11rem"
		// img.style.top="26vh";
		// img.style.left="6%";
		// img.style.zIndex=1000;
		img.src = data.resourceFile;
		img.addEventListener("click", function() {
			adPlug.ad.onclick(data, adPlug.clickId);
		})
		imgBg.append(img);
		var close = document.createElement("div");
		close.style.position = "absolute";
		close.style.width = "0.8rem";
		close.style.height = "0.8rem"
		close.style.border = "2px solid #ccc";
		close.style.fontSize = "0.8rem";
		close.style.top = "18vh";
		close.style.right = "1.5rem";
		close.style.borderRadius = "50%";
		close.style.lineHeight = "0.7rem";
		close.style.textAlign = "center";
		close.style.color = "#ccc"
		close.innerHTML = "x";
		close.addEventListener("click", function() {
			addiv.remove();
		})
		addiv.append(close);

		var lqDiv = document.createElement("div");
		lqDiv.style.position = "absolute";
		lqDiv.style.width = "80%";
		lqDiv.style.height = "2.2rem"
		lqDiv.style.top = "20.8rem";
		lqDiv.style.left = "10%";
		lqDiv.addEventListener("click", function() {
			adPlug.ad.onclick(data, adPlug.clickId);
		})
		addiv.append(lqDiv);
		document.body.append(addiv)
		// document.body.append(addiv2)
		if (adPlug.isShow) {
			adPlug.ad.show('qwadadid_success', 'ad_success', data, adPlug.clickId);
		}
	},

	showAdFail: function(data) {
		var addiv = document.createElement("div");
		addiv.id = "qwadadid_fail";
		addiv.style.display = "none";
		addiv.style.position = "fixed";
		addiv.style.width = "100vw";
		addiv.style.height = "100vh";
		addiv.style.top = "0";
		addiv.style.left = "0";
		addiv.style.zIndex = "9999";
		addiv.style.backgroundColor = "rgba(0, 0, 0, 0.7)";


		var imgBg = document.createElement("div");
		imgBg.style.position = "absolute";
		imgBg.style.width = "100%";
		imgBg.style.height = "20rem";
		imgBg.style.top = "10vh";
		imgBg.style.left = "0";
		/* imgBg.style.backgroundImage="url(https://down.quwin.cn/ad_resource/ad_plug_bg_v3.png)";
		imgBg.style.backgroundSize="100% 100%"; */
		// imgBg.style.backgroundColor="#000"
		imgBg.style.textAlign = "center";
		imgBg.style.paddingTop = "4.2rem";
		imgBg.style.boxSizing = "border-box"
		/* imgBg.addEventListener("click",function(){
			adPlug.ad.onclick(data,adPlug.clickId);
		}) */
		addiv.append(imgBg);


		var img = document.createElement("img");
		// img.style.position="absolute";
		img.style.width = "80%";
		img.style.height = "auto";
		img.style.minHeight = "11rem"
		// img.style.top="26vh";
		// img.style.left="6%";
		// img.style.zIndex=1000;
		img.src = data.resourceFile;
		img.addEventListener("click", function() {
			adPlug.ad.onclick(data, adPlug.clickId);
		})
		imgBg.append(img);
		var close = document.createElement("div");
		close.style.position = "absolute";
		close.style.width = "0.8rem";
		close.style.height = "0.8rem"
		close.style.border = "2px solid #ccc";
		close.style.fontSize = "0.8rem";
		close.style.top = "18vh";
		close.style.right = "1.5rem";
		close.style.borderRadius = "50%";
		close.style.lineHeight = "0.7rem";
		close.style.textAlign = "center";
		close.style.color = "#ccc"
		close.innerHTML = "x";
		close.addEventListener("click", function() {
			addiv.remove();
		})
		addiv.append(close);

		var lqDiv = document.createElement("div");
		lqDiv.style.position = "absolute";
		lqDiv.style.width = "80%";
		lqDiv.style.height = "2.2rem"
		lqDiv.style.top = "20.8rem";
		lqDiv.style.left = "10%";
		lqDiv.addEventListener("click", function() {
			adPlug.ad.onclick(data, adPlug.clickId);
		})
		addiv.append(lqDiv);
		document.body.append(addiv)
		// document.body.append(addiv2)
		if (adPlug.isShow) {
			adPlug.ad.show('qwadadid_fail', 'ad_fail', data, adPlug.clickId);
		}
	},

	showAdGoBack: function(data) {
		var addiv = document.createElement("div");
		addiv.id = "qwadadid_go_back";
		addiv.style.display = "none";
		addiv.style.position = "fixed";
		addiv.style.width = "100vw";
		addiv.style.height = "100vh";
		addiv.style.top = "0";
		addiv.style.left = "0";
		addiv.style.zIndex = "9999";
		addiv.style.backgroundColor = "rgba(0, 0, 0, 0.7)";


		var imgBg = document.createElement("div");
		imgBg.style.position = "absolute";
		imgBg.style.width = "100%";
		imgBg.style.height = "20rem";
		imgBg.style.top = "10vh";
		imgBg.style.left = "0";
		imgBg.style.textAlign = "center";
		imgBg.style.paddingTop = "4.2rem";
		imgBg.style.boxSizing = "border-box"
		/* imgBg.addEventListener("click",function(){
			adPlug.ad.onclick(data,adPlug.clickId);
		}) */
		addiv.append(imgBg);


		var img = document.createElement("img");
		// img.style.position="absolute";
		img.style.width = "80%";
		img.style.height = "auto";
		img.style.minHeight = "11rem"
		img.src = data.resourceFile;
		img.addEventListener("click", function() {
			adPlug.ad.onclick(data, adPlug.clickId);
		})
		imgBg.append(img);
		var close = document.createElement("div");
		close.style.position = "absolute";
		close.style.width = "0.8rem";
		close.style.height = "0.8rem"
		close.style.border = "2px solid #ccc";
		close.style.fontSize = "0.8rem";
		close.style.top = "18vh";
		close.style.right = "1.5rem";
		close.style.borderRadius = "50%";
		close.style.lineHeight = "0.7rem";
		close.style.textAlign = "center";
		close.style.color = "#ccc"
		close.innerHTML = "x";
		close.addEventListener("click", function() {
			addiv.remove();
		})
		addiv.append(close);

		var lqDiv = document.createElement("div");
		lqDiv.style.position = "absolute";
		lqDiv.style.width = "80%";
		lqDiv.style.height = "2.2rem"
		lqDiv.style.top = "20.8rem";
		lqDiv.style.left = "10%";
		lqDiv.addEventListener("click", function() {
			adPlug.ad.onclick(data, adPlug.clickId);
		})
		addiv.append(lqDiv);
		document.body.append(addiv)
		if (adPlug.isShow) {
			adPlug.ad.show('qwadadid_go_back', 'ad_go_back', data, adPlug.clickId);
		}
	},

	create: function(data) {
		if (data == null || data == undefined || data.link == null ||
			data.link == undefined || data.resourceFile == null ||
			data.resourceFile == undefined) {
			console.log("没有任何元素可展示！")
			if (adPlug.adPosition == 'ad_index') {
				adPlug.ad.showNoAdIndex();
			} else if (adPlug.adPosition == 'ad_go_back') {
				window.history.back();
			}
			return;
		}
		adPlug.clickId = $.md5(String(new Date().getTime())); //点击ID

		if (adPlug.adPosition == 'ad_index') {
			adPlug.ad.showAdIndex(data);
		} else if (adPlug.adPosition == 'ad_success') {
			adPlug.ad.showAdSuccess(data);
		} else if (adPlug.adPosition == 'ad_fail') {
			adPlug.ad.showAdFail(data);
		} else if(adPlug.adPosition == 'ad_go_back'){
			adPlug.ad.showAdGoBack(data);
		}else{
			adPlug.ad.showAdFail(data);
		}
	},


	//
	onclick: function(data, clickId) {
		var adid = data.id;
		var uid = adPlug.uid
		var phone = adPlug.phone;
		var qwplid = adPlug.qwplid;
		var queryString = encodeURI(adPlug.queryString);
		var args = "adid=" + adid + "&uid=" + uid + "&clickId=" + clickId + "&phone=" + phone + "&qwplid=" +
			qwplid + "&queryString=" + queryString;
		adPlug.jsLoader.load(adPlug.domain + '/advert/click?' + args, function() {
			adPlug.jsLoader.removeScript('ad_click_script')
		}, "utf-8", "ad_click_script");
		adPlug.ad.remove();
		if (data.link.indexOf("?") > -1) {
			window.location = data.link + "&qwclickid=" + clickId;
		} else {
			window.location = data.link + "?qwclickid=" + clickId;
		}
	},

	show: function(adId, adPosition, data, clickId) {
		var adid = data.id;
		var uid = adPlug.uid
		var phone = adPlug.phone;
		var qwplid = adPlug.qwplid;
		var queryString = encodeURIComponent(adPlug.queryString);
		var args = "adid=" + adid + "&uid=" + uid + "&clickId=" + clickId + "&phone=" + phone + "&qwplid=" +
			qwplid + "&adPosition=" + adPosition + "&queryString=" + queryString;

		adPlug.jsLoader.load(adPlug.domain + '/advert/show?' + args, function() {
			adPlug.jsLoader.removeScript('ad_show_script')
		}, "utf-8", "ad_show_script");
		// $("#qwadadid").show(); 
		$("#" + adId).show();
	},
	remove: function(adId) {
		// $("#qwadadid").remove();
		$("#" + adId).remove();
	}
};

//加载渠道JS
adPlug.initFingerPrint();
/* window.onbeforeunload = function(event) {
	     event.returnValue = false;
	adPlug.ad.getAd(true, '', 'ad_go_back', '')
	return "";
} */
/* window.onunload = function(event) {
	     event.returnValue = false;
	adPlug.ad.getAd(true, '', 'ad_go_back', '')
	return "";
}
$(function() {
	pushHistory();
	window.addEventListener("popstate", function(e) {
		adPlug.ad.getAd(true, '', 'ad_go_back', '')
	}, false);
	function pushHistory() {
		var state = {
			title: "title",
			url: "#"
		};
		window.history.pushState(state, "title", "#");
	}
}) */

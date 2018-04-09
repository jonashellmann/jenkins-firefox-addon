function buttonClicked() {
	var getSettings =  browser.storage.local.get("settings");
	getSettings.then((res) => {
		const {settings} = res;
		var baseurl = settings.baseurl;
		if(baseurl === 'https://jenkins.io/') {
			browser.runtime.openOptionsPage();
		}
		else {
			// TODO: If build is red, then open this build
			var querying = browser.tabs.query({url: baseurl + "*"});
            querying.then((tab) => {
                if(tab.length > 0) {
                    browser.tabs.update(tab[0].id, { active: true })
                } else {
                    browser.tabs.create({url: baseurl, active: true});
                }});
		}
	});
}

function handleInstalled(details) {
	if(details.reason == "install") {
		browser.storage.local.set({
			settings: {
				baseurl: 'https://jenkins.io/',
				updateinterval: 1,
				jobs: [ ]
			},
        });
	}
}

function onUpdateSettings(settings) {
	browser.alarms.clear("check");
    var interval = settings.updateinterval;
    browser.alarms.create("check", {delayInMinutes:interval, periodInMinutes:interval});
	browser.alarms.onAlarm.addListener(check);
	check();
}

function check(){
	var getSettings = browser.storage.local.get("settings");
	getSettings.then((res) => {
		const {settings} = res;
		var baseurl = settings.baseurl;
		
		if(baseurl !== 'https://jenkins.io/') {		
			browser.browserAction.setIcon({path: "images/success.png"}));
			browser.browserAction.setBadgeText(text: "0");
			var jobs = settings.jobs;
			
			for (var i = 0; i < jobs.length; i++) {
				checkJob(job, baseurl);
			}
			
			var gettingBadgeText = browser.browserAction.getBadgeText({});
			gettingBadgeText.then(function(text) {
				var totalJobs = settings.jobs.length;
				browser.browserAction.setBadgeText(text: text + " / " + totalJobs.toString());
			});
		}
	});
}

function checkJob(job, baseurl) {
	var requesturl = baseurl + "job/" + job.name + "/api/json";
	var request = new Request(requesturl, { method: 'GET' });
	fetch(request).then(analyzeJob).catch(handleError);
}

function analyzeJob(response) {
	if(response.status == "200") {
        response.text().then((body) => {
		var json = JSON.parse(body);
		var requesturl = json.builds[0].url + "api/json";
		var request = new Request(requesturl, { method: 'GET' });
		fetch(request).then(analyzeBuild).catch(handleError);
        });
    } 
	else {
		browser.browserAction.setIcon({path: "images/error.png"});
    }
}

function analyzeBuild(response) {
	if(response.ok) {
		response.text().then((body) => {
			var json = JSON.parse(body);
			if(json.building) {
				var buildnumber = json.number;
				var prevBuildNumber = buildnumber - 1;
				var buildurl = json.url;
				var prevBuildurl = buildurl.replace(buildnumber.toString(), prevBuildNumber.toString());
				var request = new Request(prevBuildurl, { method: 'GET' });
				fetch(request).then(analyzeBuild).catch(handleError);
			}
			else {
				var result = json.result;
				if(result !== "SUCCESS") {
					browser.browserAction.setIcon({path: "images/failure.png"});
					var gettingBadgeText = browser.browserAction.getBadgeText({});
					gettingBadgeText.then(function(text){
						var failingBuilds = parseInt(text, 10);
						failingBuilds++;
						browser.browserAction.setBadgeText({text: failingBuilds.toString()});
					});
				}
			}
        	});
    	}	 
	else {
        	return false;
    	}
}

function handleError(error) {
	console.log(error);
	browser.browserAction.setIcon({path: "images/error.png"});
	browser.browserAction.setBadgeText({text: ''});
};

browser.browserAction.onClicked.addListener(buttonClicked);
browser.runtime.onInstalled.addListener(handleInstalled);
browser.runtime.onMessage.addListener(msg => {
    if(msg.type == "settings-updated") {
        const {settings} = msg.message;
        onUpdateSettings(settings);
    }
});
var getSettings = browser.storage.local.get("settings"); 
getSettings.then((res) => { 
	const {settings} = res;
	onUpdateSettings(settings); 
});

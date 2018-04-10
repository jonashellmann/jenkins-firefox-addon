function buttonClicked() {
	var getSettings =  browser.storage.local.get('settings');
	getSettings.then((res) => {
		const {settings} = res;
		var baseurl = settings.baseurl;
		if(baseurl === 'https://jenkins.io/') {
			browser.runtime.openOptionsPage();
		}
		else {
			// TODO: If build is red, then open this build
			var querying = browser.tabs.query({url: baseurl + '*'});
            querying.then((tab) => {
                if(tab.length > 0) {
                    browser.tabs.update(tab[0].id, { active: true });
                } else {
                    browser.tabs.create({url: baseurl, active: true});
                }});
		}
	});
}

function handleInstalled(details) {
	if(details.reason == 'install') {
		browser.storage.local.set({
			settings: {
				baseurl: 'https://jenkins.io/',
				updateinterval: 1,
				jobs: [ ]
			}
        });
	}
}

function onUpdateSettings(settings) {
	browser.alarms.clear('check');
    var interval = settings.updateinterval;
    browser.alarms.create('check', {delayInMinutes:interval, periodInMinutes:interval});
	browser.alarms.onAlarm.addListener(check);
	check();
}

function check(){
	var getSettings = browser.storage.local.get('settings');
	getSettings.then((res) => {
		const {settings} = res;
		var baseurl = settings.baseurl;
		
		if(baseurl !== 'https://jenkins.io/') {		
			browser.browserAction.setIcon({path: 'images/success.png'});
			browser.browserAction.setBadgeText({text: '0'});
			browser.browserAction.setTitle({title: 'Jenkins Build Watcher'});
			
			var jobs = settings.jobs;
			
			for (var i = 0; i < jobs.length; i++) {
				checkJob(jobs[i], baseurl);
			}
			
			var gettingBadgeText = browser.browserAction.getBadgeText({});
			gettingBadgeText.then(function(text) {
				if(text === 0) {
					browser.browserAction.setBadgeText({text: ''});
				}
			});
		}
	});
}

function checkJob(job, baseurl) {
	var requesturl = baseurl + 'job/' + job.name + '/api/json';
	var request = new Request(requesturl, { method: 'GET' });
	fetch(request).then(analyzeJob).catch(handleError);
}

function analyzeJob(response) {
	if(response.ok) {
        response.text().then((body) => {
			var json = JSON.parse(body);
			var requesturl = json.builds[0].url + 'api/json';
			var request = new Request(requesturl, { method: 'GET' });
			fetch(request).then(analyzeBuild).catch(handleError);
		});
    } 
	else {
		handleError('Error while requesting Jenkins job!');
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
				if(result !== 'SUCCESS') {
					browser.browserAction.setIcon({path: 'images/failure.png'});
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
        handleError('Error while requesting build of Jenkins job!');
    }
}

function handleError(error) {
	console.log(error);
	browser.browserAction.setIcon({path: 'images/error.png'});
	browser.browserAction.setBadgeText({text: error});
	browser.browserAction.setTitle({title: error});
};

browser.browserAction.onClicked.addListener(buttonClicked);
browser.runtime.onInstalled.addListener(handleInstalled);
browser.runtime.onMessage.addListener(msg => {
    if(msg.type == 'settings-updated') {
        const {settings} = msg.message;
        onUpdateSettings(settings);
    }
});
var getSettings = browser.storage.local.get('settings'); 
getSettings.then((res) => { 
	const {settings} = res;
	if(settings == 'undefined') {
		handleInstalled({details: {reason: 'install'}});
		var getNewSettings = browser.storage.local.get('settings');
		getNewSettings.then((newRes) => {
			const {newSettings} = newRes;
			onUpdateSettings(newSettings);
		});
	}
	else {
		onUpdateSettings(settings); 
	}
});
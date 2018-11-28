var repos;
var token;

/**
 * Function called when clicking the Login/Logout button.
 */
// [START buttoncallback]
function toggleSignIn() {
	if (!firebase.auth().currentUser) {
		// [START createprovider]
		var provider = new firebase.auth.GithubAuthProvider();
		// [END createprovider]

		// [START addscopes]
		provider.addScope('repo');
		// [END addscopes]

		// [START signin]
		firebase.auth().signInWithPopup(provider).then(function(result) {
			// This gives you a GitHub Access Token. You can use it to access the GitHub API.
			token = result.credential.accessToken;
			//Fetch all our users repos (private & public)
			var request = new XMLHttpRequest();
			request.onload = getReposAndPrint;
			request.open('get', 'https://api.github.com/user/repos?access_token=' + token, true);
			request.send();
			// The signed-in user info.
			var user = result.user;
		})

	.catch(function(error) {
		// Handle Errors here.
		var errorCode = error.code;
		var errorMessage = error.message;
		// The email of the user's account used.
		var email = error.email;
		// The firebase.auth.AuthCredential type that was used.
		var credential = error.credential;
		// [START_EXCLUDE]
		if (errorCode === 'auth/account-exists-with-different-credential') {
			alert('You have already signed up with a different auth provider for that email.');
			// If you are using multiple auth providers on your app you should handle linking
			// the user's accounts here.
		} else {
			console.error(error);
		}
		// [END_EXCLUDE]
	});
	// [END signin]
	} else {
		// [START signout]
		firebase.auth().signOut();
		// [END signout]
	}
	// [START_EXCLUDE]
	document.getElementById('quickstart-sign-in').disabled = true;
	// [END_EXCLUDE]
}
// [END buttoncallback]

/**
 * initApp handles setting up UI event listeners and registering Firebase auth listeners:
 *  - firebase.auth().onAuthStateChanged: This listener is called when the user is signed in or
 *    out, and that is where we update the UI.
 */
function initApp() {
	// Listening for auth state changes.
	// [START authstatelistener]
	firebase.auth().onAuthStateChanged(function(user) {
	if (user) {		
		// User is signed in.
		var displayName = user.displayName;
		var email = user.email;
		var emailVerified = user.emailVerified;
		var photoURL = user.photoURL;
		var isAnonymous = user.isAnonymous;
		var uid = user.uid;
		var providerData = user.providerData;
		// [START_EXCLUDE]
		document.getElementById('quickstart-sign-in-status').textContent = 'Signed in';
		document.getElementById('quickstart-sign-in').textContent = 'Sign out';
		//document.getElementById('quickstart-account-details').textContent = JSON.stringify(user, null, '  ');
		// [END_EXCLUDE]
	} else {
		// User is signed out.
		// [START_EXCLUDE]
		document.getElementById('quickstart-sign-in-status').textContent = 'Signed out';
		document.getElementById('quickstart-sign-in').textContent = 'Sign in with GitHub';
		//document.getElementById('quickstart-account-details').textContent = 'User not logged in';
		document.getElementById('repositories').textContent = 'User not logged in';
		// [END_EXCLUDE]
	}
	// [START_EXCLUDE]
	document.getElementById('quickstart-sign-in').disabled = false;
	// [END_EXCLUDE]
	});
	// [END authstatelistener]
	document.getElementById('quickstart-sign-in').addEventListener('click', toggleSignIn, false);
}
window.onload = function() {
	initApp();
};

function getReposAndPrint() {
	google.charts.load("current", {packages:['corechart']});
	
	repos = JSON.parse(this.responseText);
	var repoList = "";
	for (var i = 0; i < repos.length; i++)
	{
		repoList += repos[i].name;
		if (i < repos.length-1) repoList += ', ';
	}
	document.getElementById('repositories').textContent = repoList;
	
	var commitCountArray = new Array(0,0,0,0); //[<5, 5-10, 10-20, 20+]
	for (var i = 0; i < repos.length; i++)
	{
		var request = new XMLHttpRequest();
		request.onload = getCommitsAndFillArray;
		request.open('get', repos[i].url + '/commits?access_token=' + token, true);
		request.send();
	}
	
	var numPrivate = 0, numPublic = 0;
	for (var i = 0; i < repos.length; i++)
	{
		if (repos[i].private) numPrivate++;
		else numPublic++;
	}
	
	google.charts.setOnLoadCallback(drawColumnChart);
	function drawColumnChart() {
		var data = google.visualization.arrayToDataTable([
			["type", "number", { role: "style" } ],
			["public", numPublic, "red"],
			["private", numPrivate, "blue"]
		]);

		var view = new google.visualization.DataView(data);
		view.setColumns([0, 1,
					   { calc: "stringify",
						 sourceColumn: 1,
						 type: "string",
						 role: "annotation" },
					   2]);

		var options = {
			title: "Number of Public and Private Repositories",
			width: 600,
			height: 400,
			bar: {groupWidth: "50%"},
			legend: { position: "none" },
		};
		var chart = new google.visualization.ColumnChart(document.getElementById("repoColumnChart"));
		chart.draw(view, options);
	}
	
		
	function getCommitsAndFillArray() {
		commits = JSON.parse(this.responseText);
		if (commits.length <= 5)
		{
			commitCountArray[0]++;
		}
		else if (commits.length <= 10)
		{
			commitCountArray[1]++;
		}
		else if (commits.length <= 20)
		{
			commitCountArray[2]++;
		}
		else
		{
			commitCountArray[3]++;
		}
		google.charts.setOnLoadCallback(drawBarChart);
	}
		
	function drawBarChart() {
		var data = google.visualization.arrayToDataTable([
			["number of commits", "number of repos"],
			["0-5", commitCountArray[0]],
			["5-10", commitCountArray[1]],
			["10-20", commitCountArray[2]],
			["20+", commitCountArray[3]]
		]);
		
		var options = {'title':'How Many Commits Your Repositories Tend To Have',
					   'width':600,
					   'height':600};
					   
		var chart = new google.visualization.PieChart(document.getElementById('commitsBarChart'));
		chart.draw(data, options);
	}
}





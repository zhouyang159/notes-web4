import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import axios from 'axios';
import { message } from 'antd';
import SignInPanel from './components/SignInPanel';
import Main from './components/Main';


const sessionKey = `${localStorage.getItem('username')}_${new Date().getTime()}`;
axios.defaults.headers.common["sessionKey"] = sessionKey;
axios.defaults.baseURL = '/api';


const App = () => {
	const didMount = useRef(false);
	const MainRef = useRef(null);
	
	const [signIn, setSignIn] = useState(() => {
		let token = localStorage.getItem('token');
		if (token) {
			axios.defaults.headers.common["token"] = token;
			return true;
		} else {
			return false;
		}
	});

	if (didMount.current === false) {
		// Add a response interceptor
		axios.interceptors.response.use(function (response) {
			// Any status code that lie within the range of 2xx cause this function to trigger
			// Do something with response data
			let { status, msg } = response.data;
			if (status !== 0) {
				message.error(msg);
				if (status === 6 || status === 7) {
					localStorage.removeItem('token');
					setSignIn(false);
				}
	
				return Promise.reject(response);
			}
			return response.data;
		}, function (error) {
			// Any status codes that falls outside the range of 2xx cause this function to trigger
			// Do something with response error
			message.error(error);
	
			return Promise.reject(error);
		});
	}

	useEffect(() => {
		// if (signIn === false) return;

		// let hostname_port = "";
		// if(process.env.NODE_ENV === 'development') {
		// 	hostname_port = "http://localhost:8080";
		// } else if (process.env.NODE_ENV === 'production') {
		// 	hostname_port = window.location.hostname + ":" + window.location.port;
		// }


		// let socket = new WebSocket(`ws://${hostname_port}/ws/asset?sessionKey=${sessionKey}`);
		// socket.onopen = function () {
		// 	console.log("WebSocket open");
		// };
		// socket.onmessage = function (msg) {
		// 	if (msg.data === 'update') {
		// 		MainRef.current.refresh();
		// 	}
		// };
	}, [signIn]);

	useEffect(() => {
		didMount.current = true;

		console.log(process.env.REACT_APP_VERSION, process.env.REACT_APP_BUILD_TIME);
		console.log(process.env);
		console.log(window.location.hostname);
		console.log(window.location.port);
	}, []);


	if (signIn) {
		return <Main
			ref={MainRef}
			logOut={() => {
				localStorage.removeItem('token');
				setSignIn(false);
				message.success("log out");
			}}
		></Main>
	} else {
		return <SignInPanel
			setSignIn={(result) => {
				if (result) {
					setSignIn(result);
				}
			}}
		></SignInPanel>
	}
};

export default App;

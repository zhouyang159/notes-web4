import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button, Input, message } from "antd";
import styled from "styled-components";
import md5 from "md5";

const Container = styled.div`
  width: 300px;
  margin: 20px auto;
`;

const Title = styled.div`
	font-size: 26px;
	text-align:  center;
`;

const Label = styled.div`
	margin-top: 10px;
`;

const RegisterDiv = styled.div`
	margin-top: 10px;
`;

const SignInPanel = (props) => {
	const { setSignIn } = props;

	const [loading, setLoading] = useState(false);
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");

	const signIn = () => {
		if (username.trim() === "") {
			message.warn("please enter username");
			return;
		}
		if (password.trim() === "") {
			message.warn("please enter password");
			return;
		}
		if (username.indexOf(" ") !== -1) {
			message.warn("invalid username");
			return;
		}
		if (password.indexOf(" ") !== -1) {
			message.warn("invalid password");
			return;
		}

		setLoading(true);
		axios
			.post("/user/login", { username: username, password: md5(password) })
			.then(({ status, data: token, msg }) => {
				localStorage.setItem("token", token);
				localStorage.setItem("username", username);
				axios.defaults.headers.common["token"] = token;
				setSignIn(true);
			})
			.catch((error) => {
				console.log(error);
			})
			.finally(() => {
				setLoading(false);
			});
	}

	useEffect(() => {
		let username = localStorage.getItem("username");
		if (username) {
			setUsername(username);
		}
	}, []);

	return <Container>
		<Title>Notes</Title>
		<Label>Username</Label>
		<Input placeholder="click to insert" value={username} onChange={(e) => setUsername(e.target.value.trim())} onPressEnter={signIn}></Input>
		<Label>Password</Label>
		<Input type="password" placeholder="click to insert" value={password} onChange={(e) => setPassword(e.target.value.trim())} onPressEnter={signIn}></Input>
		<Button loading={loading} style={{ marginTop: "20px" }} block type="primary" onClick={signIn}>sign in</Button>
		<RegisterDiv>
			<a href="/register">no account? register</a>
		</RegisterDiv>
	</Container>
}

export default SignInPanel;

import React, { useEffect, useRef, useState } from "react";
import { Result } from "antd";
import { LockFilled } from "@ant-design/icons";
import styled from "styled-components";
import Quill from "quill";
import "quill/dist/quill.snow.css"
import moment from "moment";
import { Input, message, } from "antd";
import axios from "axios";


const DetailContainer = styled.div`
	height: 100%;
	width: 698px;
	position: relative;
	.lock_panel{
		background: #bfbfbf;
		position: absolute;
		top: 0;
		width: 100%;
		height: 100%;
		z-index: 10;
		padding: 100px;
		text-align: center;
		.title{
			margin-bottom: 5px;
		}
	}
`;
const EditorContainer = styled.div`
	height: 93%;
`;

const Detail = (props) => {
	const { profile, setProfile, onContentChange, activeNote } = props;
	const didMount = useRef(false);
	const [quill, setQuill] = useState(null);
	const [textChangeHandler, setTextChangeHandler] = useState(() => {
		return () => { };
	});

	const getTextChangeHandler = (quill) => {
		return () => {
			let title = "";
			let text = JSON.stringify(quill.getText(0, 200).trim());

			let titleCharNum = 30;
			if (text.indexOf("\\n") !== -1 && text.indexOf("\\n") < titleCharNum) {
				// 回车在30个字符以内
				title = text.slice(1, text.indexOf("\\n"));
			} else {
				// 回车在30个字符以外
				title = text.slice(1, titleCharNum);
			}
			if (title.substring(title.length - 1) === "\"") {
				title = title.substring(0, title.length - 1)
			}

			if (title === "") {
				title = "New Note";
			}

			let newNote = {
				...activeNote,
				title: title,
				content: quill.getContents(),
				updateTime: moment(),
			}
			onContentChange(newNote);
		}
	}

	useEffect(() => {
		if (didMount.current === false) {
			return;
		}
		quill.off("text-change", textChangeHandler);
		quill.setContents(activeNote.content);

		let newHandler = getTextChangeHandler(quill);
		setTextChangeHandler(() => newHandler);
		quill.on("text-change", newHandler);
		if (activeNote.deleted === 1) {
			quill.enable(false);
		} else {
			quill.enable(true);
		}
	}, [activeNote]);

	useEffect(() => {
		let toolbarOptions = [
			[{ "header": [1, 2, 3, 4, 5, 6, false] }],
			["bold", "strike"],        // toggled buttons
			["blockquote", "code-block"],

			// [{ "header": 1 }, { "header": 2 }],               // custom button values
			[{ "list": "ordered" }, { "list": "bullet" }],
			// [{ "script": "sub" }, { "script": "super" }],      // superscript/subscript
			[{ "indent": "-1" }, { "indent": "+1" }],          // outdent/indent
			// [{ "direction": "rtl" }],                         // text direction

			// [{ "size": ["small", false, "large", "huge"] }],  // custom dropdown

			[{ "color": [] }, { "background": [] }],          // dropdown with defaults from theme
			// [{ "font": [] }],
			// [{ "align": [] }],

			["clean"]                                         // remove formatting button
		];

		let quill = new Quill("#editor-container", {
			modules: {
				toolbar: toolbarOptions,
			},
			placeholder: "type something here...",
			theme: "snow",  // or "bubble"，
		});
		setQuill(quill);
		quill.setContents(activeNote.content);
		quill.focus();

		let handler = getTextChangeHandler(quill);
		quill.on("text-change", handler);
		setTextChangeHandler(() => handler);

		if (activeNote.deleted === 1) {
			quill.enable(false);
		}

		didMount.current = true;
	}, []);

	return <DetailContainer className="Detail">
		{
			activeNote?.encrypt && profile.lockNote && <div className="lock_panel">
				<Result
					icon={<LockFilled />}
					title="This note had been lock"
					subTitle="enter password to unlock this note"
					extra={<Input type="password" style={{ width: 180 }} size="small" onPressEnter={(e) => {
						const key = "messageKey";
						message.loading({ content: "unlocking...", key });

						axios
							.post(`/user/validateNotePassword/${e.target.value}`)
							.then((res) => {
								if (res.status === 0) {
									setTimeout(() => {
										message.success({ content: "unlock!", key, duration: 2 });
										setProfile((pre) => {
											return {
												...pre,
												lockNote: false,
											}
										});
									}, 1000);
								}
							})
							.catch(() => {
								message.destroy(key);
							});
					}}></Input>}
				/>
			</div>
		}
		<EditorContainer id="editor-container">
		</EditorContainer>
	</DetailContainer>
};

export default Detail;

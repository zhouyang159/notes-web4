import React, { useEffect, useRef, useState } from "react";
import { Result } from "antd";
import { LockFilled } from "@ant-design/icons";
import styled from "styled-components";
import Quill from "quill";
import "quill/dist/quill.snow.css"
import moment from "moment";
import { Input, message, } from "antd";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { PROFILE, NOTES } from "../CONSTANT";
import { fetchProfile, fetchNoteById } from "../API";
import { debounce } from "debounce";


const DetailContainer = styled.div`
	height: 93%;
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
	const { activeNoteId } = props;
	const didMount = useRef(false);
	const [quill, setQuill] = useState(null);
	const [oldTextChangeHandler, setOldTextChangeHandler] = useState(() => {
		return () => { };
	});

	const [username] = useState(() => {
		return localStorage.getItem("username");
	});
	const queryClient = useQueryClient();
	const { data: profile } = useQuery([PROFILE], () => fetchProfile(username));
	const { isLoading, data: curNote } = useQuery([NOTES, activeNoteId], () => fetchNoteById(activeNoteId));
	const patchNoteMutation = useMutation(
		(newNote) => {
			const data = {
				...newNote,
				content: JSON.stringify(newNote.content),
			}
			return axios.put("/note/reorder", data);
		},
		{
			onSuccess: () => {
				queryClient.refetchQueries([NOTES], { exact: true });
			}
		}
	);

	const fillQuillContent = (quill) => {
		quill.off("text-change", oldTextChangeHandler);
		quill.setContents(curNote?.content);

		const debouncePatchNote = debounce((newNote) => {
			patchNoteMutation.mutate(newNote);
		}, 700);

		const newTextChangeHandler = () => {
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
				...curNote,
				title: title,
				content: quill.getContents(),
				updateTime: moment(),
			}
			queryClient.setQueryData([NOTES, activeNoteId], newNote);

			debouncePatchNote(newNote);
		}
		setOldTextChangeHandler(() => newTextChangeHandler);

		quill.on("text-change", newTextChangeHandler);
		if (curNote?.deleted === 1) {
			quill.enable(false);
		} else {
			quill.enable();
			quill.blur();
		}
	}

	useEffect(() => {
		if (didMount.current === false || quill === null) {
			return;
		}
		if (isLoading) {
			return;
		}
		// 只有在切换 activeNoteId 的时候，才跑这个 effect 函数
		fillQuillContent(quill);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeNoteId, isLoading]);


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
		fillQuillContent(quill);

		didMount.current = true;
		return () => {
			let toolbar = document.querySelector(".ql-toolbar");
			if (!toolbar) {
				return;
			}
			toolbar.remove();

			let editorContainer = document.querySelector("#editor-container");
			editorContainer.className = "";
			editorContainer.innerHTML = "";
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return <DetailContainer className="Detail">
		{
			curNote?.encrypt && profile.lockNote && <div className="lock_panel">
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
										queryClient.setQueryData([PROFILE], (old) => {
											return {
												...old,
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
		<EditorContainer id="editor-container"></EditorContainer>
	</DetailContainer>
};

export default Detail;

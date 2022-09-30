import React, { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import axios from "axios";
import { Button, Popconfirm, message } from "antd";
import { SyncOutlined } from "@ant-design/icons";
import styled from "styled-components";
import { v4 as uuidv4 } from "uuid";
import moment from "moment";
import NoteList from "./NoteList";
import Detail from "./Detail";


const Container = styled.div`
	width: 950px;
	height: 650px;
	margin: 10px auto;
`;
const Body = styled.div`
	border: 1px solid gray;
	height: 100%;
	background-color: white;
	display: flex;
`;
const NoteListContainer = styled.div`
	width: 250px;
	display: inline-block;
	height: 100%;
	overflow-y: auto;
	background-color: #f0f0f0;
`;

const reorder = (list, startIndex, endIndex) => {
	const result = Array.from(list);
	const [removed] = result.splice(startIndex, 1);
	result.splice(endIndex, 0, removed);
	return result;
};

let timer = null;

const Main = (props, ref) => {
	useImperativeHandle(ref, () => ({
		refresh: () => {
			getNotes();
		}
	}));
	const { logOut } = props;
	const [username] = useState(() => {
		return localStorage.getItem("username");
	});
	const [loading, setLoading] = useState(false);
	const [newId, setNewId] = useState(null);
	const [liveNoteList, setLiveNoteList] = useState([]);
	const [deletedNoteList, setDeletedNoteList] = useState([]);

	const getNotes = (cb = () => { }) => {
		setLoading(true);
		axios
			.get("/note/findAll")
			.then(({ status, data, msg }) => {
				let list = data.map((note) => {
					return {
						...note,
						content: JSON.parse(note.content),
						updateTime: moment(note.updateTime),
						createTime: moment(note.createTime),
						deleteTime: moment(note.deleteTime),
						active: false,
					}
				});
				let lives = list.filter((item) => item.deleted === 0);
				let deletes = list.filter((item) => item.deleted === 1);
				setLiveNoteList(lives);
				setDeletedNoteList(deletes);

				cb(list);
			})
			.finally(() => {
				setLoading(false);
			});
	}

	const createNoteToServer = (newNote, cb = () => { }) => {
		let content = JSON.stringify(newNote.content);
		let data = {
			...newNote,
			content: content,
		}

		axios.post("/note", data).then((res) => {
			if (res.data) {
				message.success("add note");
			}
		}).finally(() => {
			cb();
		});
	}

	const updateNoteToServer = (note, cb = () => { }, successText = null) => {
		let data = {
			...note,
			number: 0,
			content: JSON.stringify(note.content),
		}

		setLoading(true);
		axios
			.put("/note/reorder", data)
			.then((res) => {
				if (successText) {
					message.success(successText);
				}
			})
			.catch((err) => {
				console.log(err);
				message.error("update fail");
			})
			.finally(() => {
				cb();
				setTimeout(() => {
					setLoading(false);
				}, 1200);
			});
	}

	useEffect(() => {
		getNotes();
	}, []);

	const H1 = styled.h1`
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    `;

	const canNew = () => {
		let can = true;
		liveNoteList.forEach((item) => {
			if (item.id === newId) {
				can = false;
			}
		});

		return can;
	}

	const getActiveNote = () => {
		let ans = [...liveNoteList, ...deletedNoteList].find(item => item.active);
		return ans;
	}

	return <Container>
		<H1>
			<div><span>Notes</span> {loading && <SyncOutlined spin style={{ fontSize: "16px" }} />}</div>
			<div>
				<span>{username}</span>
				<Button
					style={{ marginLeft: 10 }}
					type="danger"
					disabled={!canNew()}
					onClick={() => {
						setLiveNoteList((pre) => {
							return pre.map((item) => {
								item.active = false;
								return item;
							});
						});
						setDeletedNoteList((pre) => {
							return pre.map((item) => {
								item.active = false;
								return item;
							});
						});

						let newId = uuidv4();
						let newArr = [
							{
								id: newId,
								title: "New Note",
								content: "",
								number: 0,
								createTime: moment(),
								updateTime: moment(),
								username: localStorage.getItem("username"),
								deleted: 0,
								active: false,
							},
							...liveNoteList
						].map((item, index) => {
							return {
								...item,
								active: false,
								number: index,
							}
						});
						setNewId(newId);
						setLiveNoteList(newArr);

						setTimeout(() => {
							setLiveNoteList((pre) => {
								return pre.map((item) => {
									if (item.id === newId) {
										item.active = true;
									}
									return item;
								});
							});
						}, 20);
					}}
				>
					new
				</Button>
				<Popconfirm
					title="Are you sure you want to log out?"
					onConfirm={logOut}
					okText="Yes"
					cancelText
				>
					<Button style={{ marginLeft: 10 }}>
						Log out
					</Button>
				</Popconfirm>
			</div>
		</H1>
		<Body onClick={() => {
			document.getElementById("Menu").style.display = "none";
			document.getElementById("Menu2").style.display = "none";
		}}>
			<NoteListContainer>
				<NoteList
					newId={newId}
					liveNoteList={liveNoteList}
					setLiveNoteList={setLiveNoteList}
					deletedNoteList={deletedNoteList}
					setDeletedNoteList={setDeletedNoteList}
					getNotes={getNotes}
					updateNoteToServer={updateNoteToServer}
				></NoteList>
			</NoteListContainer>
			<div>
				{
					getActiveNote() &&
					<Detail
						newId={newId}
						curNote={getActiveNote()}
						createOrUpdateNote={(note) => {
							let findIdx = -1;
							liveNoteList.find((item, index) => {
								if (item.id === note.id) {
									findIdx = index;
									return true;
								}
							});

							let newNoteList = reorder(liveNoteList, findIdx, 0).map((item, index) => {
								item.number = index;
								item.active = false;

								if (item.id === note.id) {
									return {
										...item,
										...note,
										active: true,
									}
								}
								return item;
							})
							setLiveNoteList(newNoteList);

							clearTimeout(timer);
							timer = setTimeout(() => {
								if (note.id === newId) {
									// create note
									setNewId(null);
									createNoteToServer(note);
								} else {
									// update note
									updateNoteToServer(note);
								}
							}, 700);
						}}
					>
					</Detail>
				}
			</div>
		</Body>
	</Container>
}

export default forwardRef(Main);

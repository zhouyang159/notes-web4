import React, { useEffect, useState, forwardRef, useImperativeHandle, useCallback, useRef, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { debounce } from "debounce";
import axios from "axios";
import { Button, message, Dropdown, Menu } from "antd";
import { SyncOutlined, EllipsisOutlined, LockFilled, EditFilled } from "@ant-design/icons";
import styled from "styled-components";
import { v4 as uuidv4 } from "uuid";
import moment from "moment";
import NoteList from "./NoteList";
import Detail from "./Detail";
import SettingPanel from "./panels/SettingPanel";
import AskNotePasswordModal from "./modals/AskNotePasswordModal";
import { PROFILE, NOTES } from "../CONSTANT.js";
import { fetchNotes } from "../API";


const Container = styled.div`
	width: 950px;
	height: 650px;
	margin: 10px auto;
`;
const H1 = styled.h1`
	display: flex;
	justify-content: space-between;
	align-items: baseline;
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
let lockNoteTimer = null;

const Main = (props, ref) => {
	useImperativeHandle(ref, () => ({
		refresh: () => {
			// getNotes();
		}
	}));
	const { logOut } = props;
	const [username] = useState(() => {
		return localStorage.getItem("username");
	});
	const [activeNote, setActiveNote] = useState(null);
	const [settingPanelOpen, setSettingPanelOpen] = useState(false);

	const queryClient = useQueryClient();
	const { data: profile } = useQuery([PROFILE], async () => {
		const response = await axios.get(`/user/${username}/profile`);

		let profile = response.data;
		if (profile.hasNotePassword) {
			profile = {
				...profile,
				lockNote: true,
			}
		}
	});

	const addNoteMutation = useMutation(
		(newNote) => {
			let content = JSON.stringify(newNote.content);
			let data = {
				...newNote,
				content: content,
			}

			return axios.post("/note", data).then((res) => {
				if (res.data) {
					message.success("add note");
				}
			});
		},
		{
			onMutate: async (newNote) => {
				await queryClient.cancelQueries([NOTES]);
				const previousNoteList = queryClient.getQueryData([NOTES]);
				queryClient.setQueryData([NOTES], old => [newNote, ...old]);
				setActiveNote(newNote);

				return { previousNoteList };
			},
			onError: (err, newNote, context) => {
				queryClient.setQueryData([NOTES], context.previousNoteList);
			},
			onSuccess: () => {
				queryClient.invalidateQueries(NOTES);
			}
		}
	);

	const updateNoteMutation = useMutation(
		(modifyNote) => {
			let data = {
				...modifyNote,
				number: 0,
				content: JSON.stringify(modifyNote.content),
			}

			return axios.put("/note/reorder", data);
		},
		{
			onMutate: async (modifyNote) => {
				await queryClient.cancelQueries([NOTES]);
				const previousNoteList = queryClient.getQueryData([NOTES]);

				queryClient.setQueryData([NOTES], old => {
					let arr = old
						.filter((item) => item.id !== modifyNote.id)
						.map((item, idx) => {
							return {
								...item,
								number: idx + 1,
							}
						});

					return [
						{
							...modifyNote,
							number: 0,
						},
						...arr,
					]
				});

				return { previousNoteList };
			},
			onSuccess: () => {
				queryClient.invalidateQueries(NOTES);
			}
		}
	);

	const handleContentChange = debounce((modifyNote) => {
		console.log(111, modifyNote);
		updateNoteMutation.mutate(modifyNote);
	}, 1000);

	return <div
		className="Main"
		onClick={(e) => {
			// 5 min timeout for no modify
			if (profile?.hasNotePassword) {
				clearTimeout(lockNoteTimer);
				lockNoteTimer = setTimeout(() => {
					// setProfile((pre) => {
					// 	return {
					// 		...pre,
					// 		lockNote: true,
					// 	}
					// });
				}, 5 * 60 * 1000);
			}
		}}>
		<Container>
			<H1>
				<div>
					<span
						className="title"
					>
						Notes
					</span>
					{true && <SyncOutlined spin style={{ fontSize: "16px" }} />}
				</div>
				<div>
					<span style={{ marginRight: 10 }}>{profile?.nickname || profile?.username}</span>
					<Button
						size="small" shape="circle" style={{ marginRight: 10 }}
						icon={
							<EditFilled
								onClick={() => {
									const newId = uuidv4();
									const newNote = {
										id: newId,
										title: "New Note",
										content: "",
										number: 0,
										createTime: moment(),
										updateTime: moment(),
										username: localStorage.getItem("username"),
										deleted: 0,
										active: false,
									}

									addNoteMutation.mutate(newNote);
								}}
							></EditFilled>
						}
					>
					</Button>
					{
						profile?.hasNotePassword && <Button size="small" shape="circle" style={{ marginRight: 10 }} icon={
							profile?.lockNote ?
								<LockFilled
									onClick={async () => {
										message.success("unlock note!");
									}}
								></LockFilled> :
								<span class="iconfont icon-unlocked"
									onClick={() => {
										// setProfile((pre) => {
										// 	return {
										// 		...pre,
										// 		lockNote: true,
										// 	}
										// });
										message.info("lock");
									}}
								></span>
						} />
					}
					<Dropdown
						overlay={
							<Menu
								items={[
									{
										label: <span onClick={() => setSettingPanelOpen(true)}>profile</span>,
										key: '0',
									},
									{
										label: <span onClick={logOut}>logout</span>,
										key: '1',
									},
								]}
							/>
						}
						trigger={['click']}
					>
						<Button size="small" shape="circle" icon={<EllipsisOutlined />} />
					</Dropdown>
				</div>
			</H1>
			<Body onClick={() => {
				document.getElementById("Menu").style.display = "none";
				document.getElementById("Menu2").style.display = "none";
			}}>
				<NoteListContainer>
					<NoteList
						activeNote={activeNote}
						setActiveNote={setActiveNote}
					// profile={profile}
					// getProfile={() => {}}
					// setLiveNoteList={() => {}}
					// setDeletedNoteList={setDeletedNoteList}
					// getNotes={() => {}}
					// updateNoteToServer={updateNoteToServer}
					></NoteList>
				</NoteListContainer>
				<div>
					{
						activeNote &&
						<Detail
							// profile={profile}
							// setProfile={setProfile}
							activeNote={activeNote}
							onContentChange={(newNote) => {
								handleContentChange(newNote);



								// let findIdx = -1;
								// liveNoteList.find((item, index) => {
								// 	if (item.id === note.id) {
								// 		findIdx = index;
								// 		return true;
								// 	}
								// 	return false;
								// });

								// let newNoteList = reorder(liveNoteList, findIdx, 0).map((item, index) => {
								// 	item.number = index;
								// 	item.active = false;

								// 	if (item.id === note.id) {
								// 		return {
								// 			...item,
								// 			...note,
								// 			active: true,
								// 		}
								// 	}
								// 	return item;
								// })
								// setLiveNoteList(newNoteList);

								// clearTimeout(timer);
								// timer = setTimeout(() => {
								// 	if (note.id === newId) {
								// 		// create note
								// 		setNewId(null);
								// 		createNoteToServer(note);
								// 	} else {
								// 		// update note
								// 		updateNoteToServer(note);
								// 	}
								// }, 700);
							}}
						>
						</Detail>
					}
				</div>
			</Body>
		</Container>
	</div>
}

export default forwardRef(Main);

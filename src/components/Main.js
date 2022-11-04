import React, { useState, forwardRef, useImperativeHandle, useRef, useCallback } from "react";
import { useMutation, useQuery, useQueryClient, useIsFetching } from "react-query";
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
import { PROFILE, NOTES, NEW_NOTE } from "../CONSTANT.js";
import { fetchNotes, fetchProfile } from "../API";

const MainContainer = styled.div`
	background: ${(props) => {
		if (props.backgroundColor) {
			return props.backgroundColor;
		}
		return "white";
	}};
	height: 100%;
`

const Container = styled.div`
	margin: 0 auto;
	padding-top: 10px;
	padding-bottom: 10px;
	width: 950px;
`;
const H1 = styled.h1`
	display: flex;
	justify-content: space-between;
	align-items: baseline;
`;
const Body = styled.div`
	border: 1px solid gray;
	height: 650px;
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


let lockNoteTimer = null;

const Main = (props, ref) => {
	useImperativeHandle(ref, () => ({
		refresh: () => {
			// getNotes();
		}
	}));
	const AskNotePasswordModalRef = useRef();
	const { logOut } = props;
	const [username] = useState(() => localStorage.getItem("username"));
	const [isLoading, setIsLoading] = useState(false);
	if (useIsFetching() !== 0) {
		if (isLoading === false) {
			setIsLoading(true);
		}
	} else {
		if (isLoading === true) {
			setTimeout(() => {
				setIsLoading(false);
			}, 1000);
		}
	}
	const { data: noteList = [] } = useQuery([NOTES], fetchNotes);
	const [activeNoteId, setActiveNoteId] = useState(null);
	const [settingPanelOpen, setSettingPanelOpen] = useState(false);

	const queryClient = useQueryClient();
	const { data: profile } = useQuery([PROFILE], () => fetchProfile(username));

	const addNoteMutation = useMutation(
		(newNote) => {
			let data = {
				...newNote,
				content: JSON.stringify(newNote.content),
			}

			return axios.post("/note", data).then((res) => {
				message.success("add note");
			});
		}
	);

	const validateNotePassword = () => {
		return new Promise((resolve, reject) => {
			AskNotePasswordModalRef.current.open((password) => {
				axios
					.post(`/user/validateNotePassword/${password}`)
					.then((res) => {
						if (res.status === 0) {
							AskNotePasswordModalRef.current.close();
							queryClient.setQueryData([PROFILE], (old) => {
								return {
									...old,
									lockNote: false,
								}
							});

							resolve(res);
						}
					});
			});
		});
	}

	const disabledNewBtn = useCallback(() => {
		if (isLoading) {
			return true;
		}

		let disabled = null;
		const activeNote = noteList.find(item => item.id === activeNoteId);
		if (!activeNote) {
			disabled = false;
		} else {
			if (activeNote.title === NEW_NOTE) {
				disabled = true;
			} else {
				disabled = false;
			}
		}

		return disabled;
	}, [activeNoteId, isLoading, noteList]);

	const activeColor = profile?.backgroundColor.find((item) => item.active);


	return <MainContainer
		backgroundColor={activeColor?.color}
		onClick={(e) => {
			// 5 min timeout for no modify
			if (profile?.hasNotePassword) {
				clearTimeout(lockNoteTimer);
				lockNoteTimer = setTimeout(() => {
					queryClient.setQueryData([PROFILE], (old) => {
						return {
							...old,
							lockNote: true,
						}
					});
				}, 5 * 60 * 1000);
			}
		}}
	>
		<Container>
			<H1>
				<div>
					<span
						className="title"
					>
						Notes
					</span>
					{isLoading && <SyncOutlined spin style={{ fontSize: "16px" }} />}
				</div>
				<div>
					<span style={{ marginRight: 10 }}>{profile?.nickname || profile?.username}</span>
					<Button
						disabled={disabledNewBtn()}
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

									addNoteMutation.mutate(newNote, {
										onSuccess: () => {
											setActiveNoteId(newId);
											queryClient.refetchQueries([NOTES]);
										}
									});
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
										await validateNotePassword();
										message.success("unlock note!");
									}}
								></LockFilled> :
								<span class="iconfont icon-unlocked"
									onClick={() => {
										queryClient.setQueryData([PROFILE], (old) => {
											return {
												...old,
												lockNote: true,
											}
										});
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
						activeNoteId={activeNoteId}
						setActiveNoteId={setActiveNoteId}
						validateNotePassword={validateNotePassword}
					></NoteList>
				</NoteListContainer>
				<div>
					{
						activeNoteId &&
						<Detail
							activeNoteId={activeNoteId}
							onContentChange={(modifyNote) => {
								console.log('modifyNote: ', modifyNote);
							}}
						>
						</Detail>
					}
				</div>
			</Body>
		</Container>
		{
			settingPanelOpen && <SettingPanel
				isModalOpen={settingPanelOpen}
				closeModal={() => {
					setSettingPanelOpen(false);
				}}
			></SettingPanel>
		}
		<AskNotePasswordModal ref={AskNotePasswordModalRef}></AskNotePasswordModal>
	</MainContainer>
}

export default forwardRef(Main);

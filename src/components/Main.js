import React, { useState, useRef, useCallback, useEffect } from "react";
import { useMutation, useQuery, useQueryClient, useIsFetching } from "react-query";
import axios from "axios";
import { Button, message, Dropdown, Menu, Input } from "antd";
import { SyncOutlined, EllipsisOutlined, LockFilled, EditFilled, SearchOutlined, CloseCircleOutlined } from "@ant-design/icons";
import styled from "styled-components";
import moment from "moment";
import NoteList from "./NoteList/index";
import Detail from "./Detail/index";
import SettingPanel from "./panels/SettingPanel";
import AskNotePasswordModal from "./modals/AskNotePasswordModal";
import { PROFILE, NOTES, NEW_NOTE } from "../CONSTANT.js";
import { fetchNotes, fetchProfile } from "../API";

const ICON_MARGIN_RIGHT = 10;


const MainContainer = styled.div`
	height: 100%;
	background: ${(props) => {
		if (props.backgroundColor) {
			return props.backgroundColor;
		}
		return "white";
	}};
`

const HeaderContainer = styled.div`
	margin: 0 auto;
	padding-top: 10px;
	padding-bottom: 10px;
	width: 950px;
`;
const H1 = styled.h1`
	display: flex;
	justify-content: space-between;
	align-items: baseline;
	.buttons_container {
		display: flex;
		align-items: center;
	}
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

const SearchInputContainer = styled.div`
	display: inline-block;
	-webkit-transition: all 1s;
	transition: all 0.4s;
	overflow-x: hidden;
	height: 24px;
	margin-right: 10px;
	width: ${(props) => {
		const { showSearchInput } = props;

		if (showSearchInput) {
			return "200px"
		} else {
			return "25px"
		}
	}};
`;


let autoLogoutTimer = null;
let lockNoteTimer = null;
let countDownTimer = null;

let isOnComposition = false;



const Main = (props) => {
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
	const { data: profile } = useQuery([PROFILE], () => fetchProfile(username, queryClient));

	const [showSearchInput, setShowSearchInput] = useState(false);
	const [searchStr, setSearchStr] = useState("");

	const setupAutoLogoutTimer = () => {
		clearTimeout(autoLogoutTimer);
		autoLogoutTimer = setTimeout(() => {
			logOut();
		}, 10 * 60 * 1000);
	}

	const refreshTimer = () => {
		if (profile?.hasNotePassword && profile?.lockNote === false) {
			// 5 min timeout to lock secret note

			clearInterval(countDownTimer);
			let totalSecond = 5 * 60;
			countDownTimer = setInterval(() => {
				console.warn(`${totalSecond} second left`);
				totalSecond--;
			}, 1000);


			clearTimeout(lockNoteTimer);
			lockNoteTimer = setTimeout(() => {
				clearInterval(countDownTimer);

				console.warn("lock note!");
				queryClient.setQueryData([PROFILE], (old) => {
					return {
						...old,
						lockNote: true,
					}
				});
			}, 1000 * totalSecond);
		}

		if (profile?.autoLogout !== -1) {
			// time out auto logout
			setupAutoLogoutTimer();
		}
	}

	useEffect(() => {
		if (profile?.lockNote === false) {
			refreshTimer();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [profile?.lockNote]);

	useEffect(() => {
		if (profile?.autoLogout === -1) {
			clearTimeout(autoLogoutTimer);
		} else {
			setupAutoLogoutTimer();
		}

		return () => {
			clearTimeout(autoLogoutTimer);
			clearTimeout(lockNoteTimer);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [profile?.autoLogout]);

	const addNoteMutation = useMutation(
		(newNote) => {
			let data = {
				...newNote,
				content: JSON.stringify(newNote.content),
			}

			return axios.post("/note", data);
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

	const isDisabledNewBtn = useCallback(() => {
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



	const handleSearchInputChange = (e) => {
		if (!isOnComposition) {
			console.log('onChange fire, filter is string:', e.target.value)
			setSearchStr(e.target.value);
		}
	}
	const handleComposition = (e) => {
		if (e.type === "compositionend") {
			isOnComposition = false;
			handleSearchInputChange(e);
		} else {
			isOnComposition = true;
		}
	}


	return <MainContainer
		id="MainContainer"
		backgroundColor={activeColor?.color}
		onClick={(e) => {
			refreshTimer();
		}}
		onKeyUp={() => {
			refreshTimer();
		}}
	>
		<HeaderContainer>
			<H1>
				<div>
					<span
						className="title"
					>
						Notes
					</span>
					{isLoading && <SyncOutlined spin style={{ fontSize: "16px" }} />}
				</div>
				<div className="buttons_container">
					<span style={{ marginRight: ICON_MARGIN_RIGHT }}>{profile?.nickname || profile?.username}</span>
					<Button
						disabled={isDisabledNewBtn()}
						size="small" shape="circle" style={{ marginRight: ICON_MARGIN_RIGHT }}
						icon={
							<EditFilled
								onClick={() => {
									// begin a new note
									axios.get("/snowflake/id")
										.then((res) => {
											const newId = res.data;
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
										});
								}}
							></EditFilled>
						}
					>
					</Button>
					{
						profile?.hasNotePassword && <Button size="small" shape="circle" style={{ marginRight: ICON_MARGIN_RIGHT }} icon={
							profile?.lockNote ?
								<LockFilled
									onClick={async () => {
										await validateNotePassword();
										message.success("unlock note!");
									}}
								></LockFilled> :
								<span class="iconfont icon-unlocked"
									onClick={(e) => {
										e.stopPropagation();
										clearInterval(countDownTimer);
										clearTimeout(lockNoteTimer);

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
					{
						<SearchInputContainer
							showSearchInput={showSearchInput}
							onClick={() => {
								setShowSearchInput(true);
							}}
						>
							<Input
								className="input"
								placeholder="type to search"
								// value={searchStr}
								// onChange={(e) => {
								// 	setSearchStr(e.target.value);
								// }}
								onChange={handleSearchInputChange}
								onCompositionStart={handleComposition}
								onCompositionUpdate={handleComposition}
								onCompositionEnd={handleComposition}
								size="small"
								style={{
									borderRadius: 15,
									float: "left",
								}}
								prefix={
									<SearchOutlined
										onClick={() => {
											setShowSearchInput(true);
										}}
									/>
								}
								suffix={
									<CloseCircleOutlined style={{ cursor: "pointer" }}
										onClick={() => {
											setSearchStr("");
											setTimeout(() => {
												setShowSearchInput(false);
											}, 0);
										}}
									/>
								}
							></Input>
						</SearchInputContainer>
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
			<Body
				onClick={() => {
					document.getElementById("Menu").style.display = "none";
					document.getElementById("Menu2").style.display = "none";
				}}
			>
				<NoteListContainer>
					<NoteList
						activeNoteId={activeNoteId}
						setActiveNoteId={setActiveNoteId}
						validateNotePassword={validateNotePassword}
						searchStr={searchStr}
						setIsLoading={setIsLoading}
					></NoteList>
				</NoteListContainer>
				<div>
					{
						activeNoteId &&
						<Detail
							activeNoteId={activeNoteId}
							searchStr={searchStr}
						>
						</Detail>
					}
				</div>
			</Body>
		</HeaderContainer>
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

export default Main;

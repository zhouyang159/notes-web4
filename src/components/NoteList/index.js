import React, { useEffect, useState } from "react";
import { useQuery } from "react-query";
import { message, Menu, Modal } from "antd";
import { AppstoreOutlined, DeleteOutlined, ExclamationCircleOutlined, LockFilled } from "@ant-design/icons";
import styled from "styled-components";
import { useMutation, useQueryClient } from "react-query";
import axios from "axios";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import moment from "moment";
import SetNotePwModal from "../modals/SetNotePwModal";
import { NOTES, NEW_NOTE, PROFILE } from "../../CONSTANT";
import { fetchProfile, fetchNotes, fetchNoteById } from "../../API";


const StrictModeDroppable = ({ children, ...props }) => {
	const [enabled, setEnabled] = useState(false);

	useEffect(() => {
		const animation = requestAnimationFrame(() => setEnabled(true));

		return () => {
			cancelAnimationFrame(animation);
			setEnabled(false);
		};
	}, []);

	if (!enabled) {
		return null;
	}

	return <Droppable {...props}>{children}</Droppable>;
};


const { SubMenu } = Menu;

const getListStyle = isDraggingOver => ({
	background: isDraggingOver ? "#" : "",
	padding: "8px",
});

const ACTIVE_BACKGROUND_COLOR = "#bfde3f";

const getItemStyle = (isDragging, draggableStyle, active) => {
	let background = "";
	if (isDragging) {
		background = ACTIVE_BACKGROUND_COLOR;
	} else if (active) {
		background = ACTIVE_BACKGROUND_COLOR;
	}

	return {
		background: background,
		...draggableStyle,
		cursor: "default",
	}
};

const DraggableItem = styled.div`
	padding: 12px 8px;
	border-bottom: 1px solid lightgrey;
	border-radius: 3px;
	height: 66px;
	overflow: hidden;
	position: relative;
	&:hover{
		transition: all 0.2s ;
		background: ${props => ACTIVE_BACKGROUND_COLOR};
	}
	.title {
		line-height: normal;
		font-weight: bold;
		font-size: 18px;
		width: 95%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.date {
		line-height: normal;
		font-size: 14px;
		color: ${(props) => {
		if (props.dangerText) {
			return "red";
		}
		return "gray";
	}};
	}
	.lock_icon {
		position: absolute;
		top: 18px;
		right: 6px;
	}
`;

const ContextMenu = styled.div`
	display: none;
	background-color: #d9d9d9;
	z-index: 50;
	border-radius: 5px;
	padding: 5px;
	.item {
		&:hover{
			background-color: bisque;
		}
		border-radius: 5px;
		padding: 6px;
		cursor: pointer;
	}
`;

const ConfirmContent = styled.div`
	text-align: center;
	.title {
		font-weight: bold;
	}
	.subTitle {
		font-weight: normal;
		color: #999;
	}
`;

const getLockIcon = (note, profile) => {
	if (note.encrypt) {
		if (profile?.lockNote) {
			return <LockFilled />
		} else {
			return <span className="iconfont icon-unlocked"></span>
		}
	} else {
		return null;
	}
}

const SearchResultListContainer = styled.div`
	padding: 10px ;
	>.title {
		padding-left: 5px;
		border-bottom: 1px solid gray;
	}
`;

const SearchResultList = ({
	liveNoteList = [],
	searchStr = "",
	activeNoteId = null,
	setActiveNoteId = () => { },
	profile = {},
}) => {
	const [searchResult, setSearchResult] = useState([]);

	useEffect(() => {
		if (searchStr !== "") {
			const temp = liveNoteList.filter((item) => {
				if (item.text.indexOf(searchStr) !== -1) {
					return true;
				}
				return false;
			});
			setSearchResult(temp);

			if (temp.length > 0) {
				setActiveNoteId(temp[0].id);
			} else {
				setActiveNoteId(null);
			}
		} else {
			setSearchResult([]);
		}
	}, [searchStr]);


	return <SearchResultListContainer>
		<h2 className="title">search result</h2>
		{
			searchResult.map((note) => {
				return <DraggableItem
					style={{
						background: note.id === activeNoteId && ACTIVE_BACKGROUND_COLOR,
					}}
					onClick={() => {
						setActiveNoteId(note.id);
					}}
				>
					<div className="title">{note.title}</div>
					<div className="date">{note.createTime.format("yyyy/MM/DD HH:mm:ss")}</div>
					<div className="lock_icon">{getLockIcon(note, profile)}</div>
				</DraggableItem>
			})
		}
	</SearchResultListContainer>
}

const NoteList = (props) => {
	const { activeNoteId, setActiveNoteId, validateNotePassword, searchStr } = props;

	const [isSetNotePwModalOpen, setIsSetNotePwModalOpen] = useState(false);
	const username = useState(() => localStorage.getItem("username"))[0];
	const { data: profile } = useQuery([PROFILE], () => fetchProfile(username));
	const { data: noteList = [] } = useQuery([NOTES], fetchNotes);
	const liveNoteList = noteList.filter((item) => item.deleted === 0);
	const trashNoteList = noteList.filter((item) => item.deleted === 1);
	const { data: activeNote } = useQuery([NOTES, activeNoteId], () => {
		if (activeNoteId === null) return null
		return fetchNoteById(activeNoteId);
	});


	const queryClient = useQueryClient();
	const reorderMutation = useMutation(
		(newList) => {
			const data = newList.map(note => {
				return {
					...note,
					content: JSON.stringify(note.content),
				}
			});

			queryClient.cancelQueries([NOTES]);
			queryClient.setQueryData([NOTES], (oldData) => {
				return [...newList, ...trashNoteList]
			});

			return axios.put("/note/updateLiveNoteList", data);
		},
		{
			onSettled: () => {
				queryClient.invalidateQueries([NOTES]);
			}
		}
	);
	const moveToTrashMutation = useMutation(
		(id) => {
			return axios.delete(`/note/toTrash/${id}`);
		},
		{
			onSuccess: async () => {
				// active the next one note
				let findIdx = -1;
				liveNoteList.find((item, idx) => {
					if (activeNoteId === item.id) {
						findIdx = idx;
						return true;
					}
					return false;
				});

				let newActiveNote = liveNoteList[findIdx + 1];
				if (newActiveNote) {
					setActiveNoteId(newActiveNote.id);
				} else {
					setActiveNoteId(null);
				}

				queryClient.invalidateQueries([NOTES]);
			},
		}
	);
	const recoverNoteMutation = useMutation(
		() => {
			const newNote = {
				...activeNote,
				content: JSON.stringify(activeNote.content),
				deleted: 0,
				updateTime: moment(),
			}
			return axios.put("/note", newNote);
		},
		{
			onSettled: () => {
				queryClient.invalidateQueries([NOTES]);
				setActiveNoteId(null);
			}
		}
	);
	const deleteNoteMutation = useMutation(
		(id) => {
			queryClient.setQueryData([NOTES], (oldData) => {
				let newData = oldData.filter((note) => note.id !== id);
				return newData;
			});

			return axios.delete(`/note/${id}`).then(() => {
				message.success("delete success");
			})
		},
		{
			onSettled: () => {
				queryClient.invalidateQueries([NOTES], { exact: true });
			}
		}
	);
	const patchNoteMutation = useMutation(
		(newNote) => {
			const data = {
				...newNote,
				content: JSON.stringify(newNote.content),
				version: newNote.version + 1,
			}
			return axios.put("/note", data);
		},
		{
			onSettled: () => {
				queryClient.invalidateQueries([NOTES]);
			}
		}
	);

	const hideContextMenu = () => {
		const Menu = document.getElementById("Menu");
		Menu.style.display = "none";
		const Menu2 = document.getElementById("Menu2");
		Menu2.style.display = "none";
	}


	return <>
		<ContextMenu id="Menu">
			<div
				className="item"
				onClick={async () => {
					const moveToTrash = () => {
						const divId = activeNote.id.substring(0, activeNote.id.indexOf("-"));
						const element = document.getElementById(divId);
						element.style.background = "red";
						setTimeout(() => {
							element.style.transition = "all 0.4s";
							element.style.padding = 0;
							element.style.height = 0;
							element.style.border = 0;
						}, 10);

						setTimeout(() => {
							if (activeNote.title === NEW_NOTE) {
								queryClient.setQueryData([NOTES], (old) => {
									return old.filter((item) => item.id !== activeNoteId);
								});
								axios.delete(`/note/${activeNoteId}`).catch((err) => {
									console.log(err);
								});
							} else {
								moveToTrashMutation.mutate(activeNoteId);
							}
						}, 400);
					}

					if (activeNote.encrypt) {
						if (profile.lockNote) {
							// now is lock status, let's unlock first
							await validateNotePassword();
							moveToTrash();
						} else {
							// now is unlock status
							moveToTrash();
						}
					} else {
						moveToTrash();
					}
				}}
			>
				move to trash
			</div>
			<div
				className="item"
				onClick={async () => {
					if (profile?.hasNotePassword) {
						const addLockOrRemoveLock = () => {
							if (activeNote.encrypt) {
								// remove lock
								let newNote = {
									...activeNote,
									encrypt: false,
								}
								patchNoteMutation.mutate(newNote);
							} else {
								// add lock
								let newNote = {
									...activeNote,
									encrypt: true,
								}
								patchNoteMutation.mutate(newNote);
							}
						}

						if (profile.lockNote) {
							// now is lock status, let's unlock first
							await validateNotePassword();
							addLockOrRemoveLock();
						} else {
							// now is unlock status
							addLockOrRemoveLock();
						}
					} else {
						// set new note password
						setIsSetNotePwModalOpen(true);
					}
				}}
			>
				{activeNote?.encrypt ? "remove lock" : "add lock"}
			</div>
		</ContextMenu>
		<ContextMenu id="Menu2">
			<div
				className="item"
				onClick={() => {
					recoverNoteMutation.mutate();
				}}
			>
				recover
			</div>
			<div
				className="item"
				onClick={() => {
					Modal.confirm({
						icon: <ExclamationCircleOutlined />,
						content: <ConfirmContent>
							<div className="title" >Are you sure you want to delete the note permanently?</div>
							<div className="subTitle">You cannot undo this action.</div>
						</ConfirmContent>,
						centered: true,
						okText: "Delete",
						okButtonProps: { danger: true },
						cancelText: "Cancel",
						onOk: () => {
							deleteNoteMutation.mutate(activeNoteId, {
								onSuccess: () => {
									setActiveNoteId(null);
								}
							});
						}
					});
				}}
			>
				delete
			</div>
		</ContextMenu>

		{
			searchStr === "" && <div className="NoteList">
				<Menu
					defaultOpenKeys={["sub1", "sub2"]}
					mode="inline"
					selectedKeys={[]}
				>
					<SubMenu key="sub1" icon={<AppstoreOutlined />} title="Notes">
						<DragDropContext
							onDragEnd={(result) => {
								if (!result.destination) {
									return;
								}

								let newLiveNoteList = Array.from(liveNoteList);
								const [removed] = newLiveNoteList.splice(result.source.index, 1);
								newLiveNoteList.splice(result.destination.index, 0, removed);
								for (let i = 0; i < newLiveNoteList.length; i++) {
									newLiveNoteList[i].number = i;
								}

								reorderMutation.mutate(newLiveNoteList);
							}}
						>
							<StrictModeDroppable droppableId="droppable_subMenu_1">
								{(provided, snapshot) => {
									return <div
										{...provided.droppableProps}
										ref={provided.innerRef}
										style={getListStyle(snapshot.isDraggingOver)}
									>
										{liveNoteList.map((note, index) => {
											return <Draggable key={note.id} draggableId={note.id} index={index}>
												{(provided, snapshot) => (
													<DraggableItem
														id={note.id.substring(0, note.id.indexOf("-"))}
														ref={provided.innerRef}
														{...provided.draggableProps}
														{...provided.dragHandleProps}
														style={getItemStyle(
															snapshot.isDragging,
															provided.draggableProps.style,
															note.id === activeNoteId
														)}
														onClick={() => {
															liveNoteList.forEach(item => {
																if (item.title === NEW_NOTE && item.id !== note.id) {
																	// this note's content is empty, we delete it forever
																	axios.delete(`/note/${item.id}`)
																		.then(() => {
																			queryClient.refetchQueries([NOTES]);
																		})
																		.catch((err) => {
																			message.error("delete note error");
																			console.log(err);
																		});
																}
															});

															setActiveNoteId(note.id);
														}}
														onContextMenu={(e) => {
															e.preventDefault();
															hideContextMenu();
															setActiveNoteId(note.id);

															const clickX = e.clientX;
															const clickY = e.clientY;
															const Menu = document.getElementById("Menu");
															Menu.style.display = "block";
															Menu.style.position = "absolute";
															Menu.style.left = `${clickX}px`; Menu.style.top = `${clickY}px`;
														}}
													>
														<div className="title">{note.title}</div>
														<div className="date">{note.createTime.format("yyyy/MM/DD HH:mm:ss")}</div>
														<div className="lock_icon">{getLockIcon(note, profile)}</div>
													</DraggableItem>
												)}
											</Draggable>
										})}
										{provided.placeholder}
									</div>
								}}
							</StrictModeDroppable>
						</DragDropContext>
					</SubMenu>

					<SubMenu key="sub2" icon={<DeleteOutlined />} title="Trash">
						<div
							style={getListStyle(false)}
						>
							{trashNoteList.map((note) => {
								let eraseDate = moment(note.deleteTime).add(11, "days");
								let remainingDay = eraseDate.diff(moment(), "days");

								let dangerText = false;
								if (remainingDay < 3) {
									dangerText = true;
								}

								return <DraggableItem
									key={note.id}
									dangerText={dangerText}
									style={getItemStyle(
										false,
										{},
										note.id === activeNoteId,
									)}
									onClick={() => {
										setActiveNoteId(note.id);
									}}
									onContextMenu={(e) => {
										hideContextMenu();
										setActiveNoteId(note.id);

										e.preventDefault();
										const clickX = e.clientX;
										const clickY = e.clientY;
										const Menu = document.getElementById("Menu2");
										Menu.style.display = "block";
										Menu.style.position = "absolute";
										Menu.style.left = `${clickX}px`;
										Menu.style.top = `${clickY}px`;
									}}
								>
									<div className="title">{note.title}</div>
									<div className="date">{remainingDay} days</div>
									<div className="lock_icon">{getLockIcon(note, profile)}</div>
								</DraggableItem>
							})}
						</div>
					</SubMenu>
				</Menu>
			</div >
		}

		{
			searchStr !== "" && <SearchResultList
				liveNoteList={liveNoteList}
				searchStr={searchStr}
				activeNoteId={activeNoteId}
				setActiveNoteId={setActiveNoteId}
				profile={profile}
			></SearchResultList>
		}

		{
			isSetNotePwModalOpen && <SetNotePwModal
				isModalOpen={isSetNotePwModalOpen}
				closeModal={() => {
					setIsSetNotePwModalOpen(false);
				}}
				onSuccess={() => {
					message.success("set note password success");
					setTimeout(() => {
						setIsSetNotePwModalOpen(false);
						queryClient.invalidateQueries([PROFILE]);
						// add lock
						let newNote = {
							...activeNote,
							encrypt: true,
						}
						patchNoteMutation.mutate(newNote);
					}, 600);
				}}
			></SetNotePwModal>
		}
	</>
};

export default NoteList;

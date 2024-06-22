import React, {useCallback, useEffect, useRef, useState} from "react";
import {Result} from "antd";
import {LockFilled} from "@ant-design/icons";
import styled from "styled-components";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import moment from "moment";
import {Input, message, Button} from "antd";
import axios from "axios";
import {useMutation, useQuery, useQueryClient} from "react-query";
import {PROFILE, NOTES} from "../../CONSTANT";
import {fetchProfile, fetchNoteById} from "../../API";
import {debounce} from "debounce";
import * as Emoji from "quill-emoji";

Quill.register("modules/emoji", Emoji);


const DetailContainer = styled.div`
    height: 100%;
    width: 698px;
    position: relative;

    .lock_panel {
        background: #bfbfbf;
        position: absolute;
        top: 0;
        width: 100%;
        height: 100%;
        z-index: 10;
        padding: 100px;
        text-align: center;

        .title {
            margin-bottom: 5px;
        }
    }

    .ql-container {
        height: 93%;
    }
`;

const SaveBtn = styled(Button)`
    position: absolute;
    top: 10px;
    right: 10px;
`;


const Detail = (props) => {
    const {activeNoteId, searchStr} = props;
    const didMount = useRef(false);
    const quillRef = useRef(null);
    const [quill, setQuill] = useState(null);
    const [isHightLight, setIsHightLight] = useState(false);
    const [isChange, setIsChange] = useState(false);

    const [username] = useState(() => {
        return localStorage.getItem("username");
    });
    const queryClient = useQueryClient();
    const {data: profile} = useQuery([PROFILE], () => fetchProfile(username, queryClient));
    const {
        isLoading: isLoadingCurNote,
        data: curNote
    } = useQuery([NOTES, activeNoteId], () => fetchNoteById(activeNoteId));

    const patchNoteMutation = useMutation(
        (newNote) => {
            const data = {
                ...newNote,
                content: JSON.stringify(newNote.content),
            }
            return axios.put("/note", data);
        },
        {
            onMutate: () => {
            },
            onSuccess: (data, variables, context) => {
                message.destroy();
                message.success("saved!", 2);

                // eslint-disable-next-line
                let {data: noteArr, msg, status} = data;
                let newNote = noteArr.find((note) => note.id === activeNoteId);

                newNote = {
                    ...newNote,
                    content: JSON.parse(newNote.content),
                }

                queryClient.setQueryData([NOTES, activeNoteId], newNote);
                queryClient.refetchQueries([NOTES], {exact: true});
            },
            onError: (error, variables, context) => {
                message.error("save failed!");
                console.error(error);
            },
        }
    );

    const fillQuillContent = (quill, cb = () => {
    }) => {
        if (isLoadingCurNote) {
            quill.setContents([
                {insert: 'Loading...'}
            ]);
        } else {
            quill.setContents(curNote?.content);
        }

        if (curNote?.deleted === 1) {
            quill.enable(false);
        } else {
            quill.enable();

            if (searchStr === "") {
                quill.blur();
            }
        }

        if (curNote?.title === "New Note") {
            //if user is add a new note, then we focus the editor
            quill.focus();
        }

        cb();
    }

    const hightLightSearchStr = (searchStr) => {
        if (!searchStr) {
            setIsHightLight(false);
            return;
        }

        setIsHightLight(true);
        const text = quill.getText();
        let i = searchStr.length * -1;
        while (~(i = text.toLowerCase().indexOf(searchStr.toLowerCase(), i + searchStr.length))) {
            quill.formatText(i, searchStr.length, 'background', '#ffda90');
        }
    }

    const handleSaveNote = useCallback(() => {
        const newNote = {
            ...curNote,
            content: quill.getContents(),
            updateTime: moment(),
        }

        message.loading("saving...", 0);

        debounceUpdate(newNote);
        setIsChange(false);
    }, [curNote, quill]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey && e.key === 's') || (e.metaKey && e.key === 's')) {
                e.preventDefault();
                handleSaveNote();
            }
        };

        const quillContainer = quillRef.current;
        if (quillContainer) {
            quillContainer.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            if (quillContainer) {
                quillContainer.removeEventListener('keydown', handleKeyDown);
            }
        };
    }, [handleSaveNote]);

    useEffect(() => {
        if (didMount.current === false || quill === null) {
            return;
        }

        fillQuillContent(quill, () => {
            hightLightSearchStr(searchStr);
        });

        // 只有在切换 activeNoteId 的时候，才跑这个 effect 函数
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeNoteId, isLoadingCurNote]);

    useEffect(() => {
        if (didMount.current === false || quill === null) {
            return;
        }

        // 每次 hightLight 文本前，先重置当前note 的内容
        quill.setContents(curNote?.content);
        hightLightSearchStr(searchStr);
    }, [searchStr]);

    useEffect(() => {
        const toolbarOptions = {
            container: [
                [{"header": [1, 2, 3, 4, 5, 6, false]}],
                ["bold", "strike"],        // toggled buttons
                ["blockquote", "code-block"],

                // [{ "header": 1 }, { "header": 2 }],               // custom button values
                [{"list": "ordered"}, {"list": "bullet"}],
                // [{ "script": "sub" }, { "script": "super" }],      // superscript/subscript
                [{"indent": "-1"}, {"indent": "+1"}],          // outdent/indent
                // [{ "direction": "rtl" }],                         // text direction

                // // [{ "size": ["small", false, "large", "huge"] }],  // custom dropdown

                [{"color": []}, {"background": []}],          // dropdown with defaults from theme
                // // [{ "font": [] }],
                // // [{ "align": [] }],
                // ["clean"]                                         // remove formatting button
                ['emoji'],
            ],
            handlers: {
                'emoji': function () {
                }
            }
        }

        let quill = new Quill("#editor-container", {
            modules: {
                toolbar: toolbarOptions,
                "emoji-toolbar": true,
                // "emoji-textarea": true,
                "emoji-shortname": true,
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

            // let editorContainer = document.querySelector("#editor-container");
            // editorContainer.className = "";
            // editorContainer.innerHTML = "";
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const [debounceUpdate] = useState(() => {
        const debounceUpdate = debounce((note) => {
            patchNoteMutation.mutate(note);
        }, 500);
        return debounceUpdate;
    });

    useEffect(() => {
        const textChangeHandler = (delta, oldDelta, source) => {
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

            setIsChange(true);

            // debounceUpdate(newNote);
        }

        quill?.on("text-change", textChangeHandler);
        return () => {
            quill?.off("text-change", textChangeHandler);
        }
    });

    const passwordInputRef = useRef();
    useEffect(() => {
        passwordInputRef.current?.focus();
    }, [curNote]);

    return <DetailContainer
        className="Detail"
        onClick={() => {
            if (isHightLight) {
                const range = quill.getSelection();
                quill.setContents(curNote?.content);
                quill.setSelection(range.index, 0); // position the cursor in mouse click
                setIsHightLight(false);
            }
        }}
    >
        {
            curNote?.encrypt &&
            profile.lockNote &&
            <div className="lock_panel">
                <Result
                    icon={<LockFilled/>}
                    title="This note had been lock"
                    subTitle="enter note password to unlock this note"
                    extra={
                        <Input
                            ref={passwordInputRef}
                            type="password"
                            style={{width: 180}}
                            size="small"
                            autoComplete="new-password"
                            onPressEnter={(e) => {
                                const key = "messageKey";
                                message.loading({content: "unlocking...", key});

                                axios
                                    .post(`/user/validateNotePassword/${e.target.value}`)
                                    .then((res) => {
                                        if (res.status === 0) {
                                            message.success({content: "unlock!", key, duration: 2});
                                            queryClient.setQueryData([PROFILE], (old) => {
                                                return {
                                                    ...old,
                                                    lockNote: false,
                                                }
                                            });
                                        }
                                    })
                                    .catch(() => {
                                        message.destroy(key);
                                    });
                            }}
                        ></Input>
                    }
                />
            </div>
        }
        <div id="editor-container" ref={quillRef}></div>
        <SaveBtn
            size="small"
            disabled={!isChange}
            onClick={handleSaveNote}
        >save</SaveBtn>
    </DetailContainer>
};

export default Detail;

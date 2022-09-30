import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import axios from 'axios';
import { message, Button } from 'antd';
import SignInPanel from './components/SignInPanel';
import Main from './components/Main';
import 'animate.css';
import styled from 'styled-components';
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
// import type { Quote as QuoteType } from "../types";


// const App = () => {

// 	const handleOnclick = () => {
// 		const element = document.querySelector('.my-element');
// 		element.classList.add('animate__animated', 'animate__slideOutUp');

// 		element.addEventListener('animationend', () => {
// 			// do something
// 			console.log("do something");
// 		});
// 	}

// 	return <div>
// 		App
// 		<Button onClick={handleOnclick}>animate</Button>

// 		<div className='my-element'>test animate</div>
// 	</div>
// };


const initial = Array.from({ length: 10 }, (v, k) => k).map(k => {
	const custom: Quote = {
		id: `id-${k}`,
		content: `Quote ${k}`
	};

	return custom;
});

const grid = 8;
const reorder = (list, startIndex, endIndex) => {
	const result = Array.from(list);
	const [removed] = result.splice(startIndex, 1);
	result.splice(endIndex, 0, removed);

	return result;
};

const QuoteItem = styled.div`
  width: 200px;
  border: 1px solid grey;
  margin-bottom: ${grid}px;
  background-color: lightblue;
  padding: ${grid}px;
  height: 40px;
`;

function Quote({ quote, index }) {
	return (
		<Draggable draggableId={quote.id} index={index}>
			{provided => (
				<QuoteItem
					className={quote.id}
					ref={provided.innerRef}
					{...provided.draggableProps}
					{...provided.dragHandleProps}
				>
					{quote.content}
				</QuoteItem>
			)}
		</Draggable>
	);
}

const QuoteList = React.memo(function QuoteList({ quotes }) {
	return quotes.map((quote, index) => (
		<Quote quote={quote} index={index} key={quote.id} />
	));
});

function QuoteApp() {
	const [state, setState] = useState({ quotes: initial });

	function onDragEnd(result) {
		if (!result.destination) {
			return;
		}

		if (result.destination.index === result.source.index) {
			return;
		}

		const quotes = reorder(
			state.quotes,
			result.source.index,
			result.destination.index
		);

		setState({ quotes });
	}

	const handleOnclick = () => {
		let id = "id-3"
		const element = document.querySelector(`.${id}`);

		element.style.transition = "all 0.4s";
		element.style.transitionTimingFunction = "ease";
		element.style.overflow = 'hidden';

		setTimeout(() => {
			element.style.height = 0;
			element.style.padding = 0;
			element.style.border = 0;
			element.style.marginBottom = 0;
		}, 20);



		setTimeout(() => {
			setState((pre) => {
				let arr = pre.quotes.filter((item) => {
					return item.id !== id;
				});
				return {
					quotes: arr,
				}
			});
		}, 1300);

		// element.classList.add('animate__animated', 'animate__slideOutLeft');

		// element.addEventListener('animationend', () => {
		// 	// do something
		// 	console.log("do something");
		// 	setState((pre) => {

		// 		let arr = pre.quotes.filter((item) => {
		// 			return item.id !== id;
		// 		});

		// 		console.log(arr);

		// 		return {
		// 			quotes: arr,
		// 		};

		// 	});
		// });
	}

	return (
		<>
			<Button onClick={handleOnclick}>animate</Button>

			<DragDropContext onDragEnd={onDragEnd}>
				<Droppable droppableId="list">
					{provided => (
						<div ref={provided.innerRef} {...provided.droppableProps}>
							<QuoteList quotes={state.quotes} />
							{provided.placeholder}
						</div>
					)}
				</Droppable>
			</DragDropContext>
		</>
	);
}

export default QuoteApp;

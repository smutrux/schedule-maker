import "./App.css";
import { useState } from "react";
import { Button } from "./components/Button";
import {
	TextInput,
	Checkbox,
	ColourPicker,
	TimePicker,
	Dropdown,
} from "./components/Input/Input";
import { Modal } from "./components/Modal/Modal";

function App() {
	// const [text, setText] = useState("");
	// const [checked, setChecked] = useState(false);
	// const [color, setColor] = useState("#6b93c4");
	// const [time, setTime] = useState("");
	// const [selected, setSelected] = useState("a");
	const [itemOpen, setItemOpen] = useState(false);
	const [preferencesOpen, setPreferencesOpen] = useState(false);
	let modalTitle = "Add Item to Schedule";
	let preferencesTitle = "Schedule preferences";

	// let handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) =>
	// 	setText(e.target.value);

	let addItem = () => {
		console.log("Adding item");
	};

	let colourOptions = [
		{ value: "#BCBEF1", label: "Quiet Violet" },
		{ value: "#B7CFFF", label: "Smooth Blue" },
		{ value: "#ADEB97", label: "Serene Green" },
		{ value: "#FFEF98", label: "Mellow Yellow" },
		{ value: "#FFC29F", label: "Beach Peach" },
		{ value: "#FFA4A4", label: "Tranquil Pink" },
	];

	return (
		<div className="content-wrapper">
			{/* <Button text="Button" />
			<Button text="Button" icon="save" />
			<Button text="Button" icon="save" reverse />
			<Button icon="save" />

			<TextInput
				value={text}
				onChange={handleTextChange}
				label="Full name"
				placeholder="Jane Smith"
			/>
			<Checkbox checked={checked} onChange={setChecked} label="Monday" />
			<ColourPicker value={color} onChange={setColor} label="Accent colour" />
			<TimePicker value={time} onChange={setTime} label="Start time" />
			<Dropdown
				options={[
					{ value: "a", label: "Option A" },
					{ value: "b", label: "Option B" },
				]}
				label="Category"
				value={selected}
				onChange={setSelected}
			/>

			<Button
				text="Open item modal"
				onClick={() => setItemOpen(true)}
				icon="open_in_full"
				reverse
			/>

			<Button
				text="Open pref modal"
				onClick={() => setPreferencesOpen(true)}
				icon="open_in_full"
				reverse
			/> */}

			<h1>Pretty Schedule Maker</h1>
			<p>Jump straight into creating your own schedule below</p>

			<div className="btn-large-grid">
				<Button large icon="new_window" text="Start New" />
				<Button large icon="add_ad" text="Add Item" disabled />
				<Button large icon="print" text="Print" disabled />
				<Button large icon="dashboard" text="Preview" disabled />
				<Button large icon="picture_as_pdf" text="Download as Document" disabled />
				<Button large icon="image" text="Download as Image" disabled />
				<Button large icon="file_json" text="Export" disabled />
				<Button large icon="upload" text="Import" />
			</div>

			<Modal
				title={modalTitle}
				isOpen={itemOpen}
				onClose={() => setItemOpen(false)}
				width={640}
			>
				<div className="modal-contents">
					<TextInput label="Title" placeholder="PROG-1p01"></TextInput>
					<TextInput label="Details" placeholder="Lab"></TextInput>

					<TimePicker label="Start Time"></TimePicker>
					<TimePicker label="End Time"></TimePicker>

					<Dropdown label="Item Colour" options={colourOptions}></Dropdown>
					<Checkbox label="Online"></Checkbox>

					{/* line break */}
					<div style={{ width: "100%" }}></div>

					<Checkbox label="Monday"></Checkbox>
					<Checkbox label="Tuesday"></Checkbox>
					<Checkbox label="Wednesday"></Checkbox>
					<Checkbox label="Thursday"></Checkbox>
					<Checkbox label="Friday"></Checkbox>
					<Checkbox label="Saturday"></Checkbox>
					<Checkbox label="Sunday"></Checkbox>

					{/* line break */}
					<div style={{ width: "100%" }}></div>

					<div style={{ justifyContent: "center" }}>
						<Button
							text="Add Item"
							onClick={() => addItem()}
							icon="add_ad"
						></Button>
					</div>
				</div>
			</Modal>

			<Modal
				title={preferencesTitle}
				isOpen={preferencesOpen}
				onClose={() => setPreferencesOpen(false)}
				width={300}
			>
				<div className="modal-contents">
					<TextInput
						label="Name"
						placeholder="Jane's Winter Semester 2026"
					></TextInput>
					<Checkbox label="24 hr Time"></Checkbox>

					<TimePicker label="Earliest Start Time"></TimePicker>
					<TimePicker label="Latest End Time"></TimePicker>

					<ColourPicker label="Add Custom Colour"></ColourPicker>

					<div style={{ justifyContent: "center" }}>
						<Button text="Save" onClick={() => addItem()} icon="save"></Button>
					</div>
				</div>
			</Modal>
		</div>
	);
}

export default App;

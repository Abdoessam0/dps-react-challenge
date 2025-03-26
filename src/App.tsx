import { useState, useEffect, useMemo, useRef, ChangeEvent } from "react";
import axios from "axios";
import {
	AppBar,
	Toolbar,
	Typography,
	Container,
	Box,
	TextField,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Checkbox,
	FormControlLabel,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	RadioGroup,
	FormLabel,
	Radio,
	createTheme,
	ThemeProvider,
	IconButton,
} from "@mui/material";
import { alpha } from "@mui/material/styles"; // For translucent highlight
import { pink, yellow, purple, blue } from "@mui/material/colors";
import SearchIcon from "@mui/icons-material/Search";
import dpsLogo from "./assets/DPS.svg";
import "./App.css";

// 1) Interfaces
interface Address {
	city: string;
}
interface User {
	id: number;
	firstName: string;
	lastName: string;
	birthDate: string;
	address: Address;
}

// 2) Theme color mapping (single shade)
type ThemeColor = "pink" | "yellow" | "purple" | "blue";
const colorMap: Record<ThemeColor, string> = {
	pink: pink[500],
	yellow: yellow[500],
	purple: purple[500],
	blue: blue[500],
};

function App() {
	// 3) States
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState<boolean>(true);

	// Filter states
	const [searchName, setSearchName] = useState<string>("");
	const [selectedCity, setSelectedCity] = useState<string>("");
	const [highlightOldest, setHighlightOldest] = useState<boolean>(false);
	const [themeColor, setThemeColor] = useState<ThemeColor>("pink");

	// Debounce ref (use number in browser)
	const debounceRef = useRef<number | null>(null);

	// 4) Fetch data
	useEffect(() => {
		axios
			.get("https://dummyjson.com/users")
			.then((res) => {
				setUsers(res.data.users || []);
				setLoading(false);
			})
			.catch((err) => {
				console.error("Error fetching users:", err);
				setLoading(false);
			});
	}, []);

	// 5) Debounce search
	const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		if (debounceRef.current) {
			window.clearTimeout(debounceRef.current);
		}
		debounceRef.current = window.setTimeout(() => {
			setSearchName(value);
		}, 1000);
	};

	// 6) Filter logic
	const filteredUsers = useMemo(() => {
		let data = users;
		if (searchName) {
			data = data.filter(
				(u) =>
					u.firstName.toLowerCase().includes(searchName.toLowerCase()) ||
					u.lastName.toLowerCase().includes(searchName.toLowerCase())
			);
		}
		if (selectedCity) {
			data = data.filter((u) => u.address.city === selectedCity);
		}
		return data;
	}, [users, searchName, selectedCity]);

	// 7) Oldest user per city
	const oldestUsersPerCity = useMemo(() => {
		const map = new Map<string, User>();
		users.forEach((user) => {
			const city = user.address.city;
			const existing = map.get(city);
			if (!existing || new Date(user.birthDate) < new Date(existing.birthDate)) {
				map.set(city, user);
			}
		});
		return map;
	}, [users]);

	// 8) Dynamic theme
	const theme = useMemo(() => {
		return createTheme({
			palette: {
				primary: {
					main: colorMap[themeColor],
				},
			},
		});
	}, [themeColor]);

	// 9) Render
	return (
		<ThemeProvider theme={theme}>
			<AppBar position="static" color="primary">
				<Toolbar>
					<img src={dpsLogo} alt="DPS Logo" className="logo" />
					<Typography variant="h6" sx={{ flexGrow: 1 }}>
						DPS React Challenge
					</Typography>
				</Toolbar>
			</AppBar>

			<Container className="App-container">
				{/* Theme Color Selector */}
				<Box className="control-item">
					<FormLabel component="legend">Theme Color:</FormLabel>
					<RadioGroup
						row
						value={themeColor}
						onChange={(e) => setThemeColor(e.target.value as ThemeColor)}
					>
						<FormControlLabel value="pink" control={<Radio />} label="Pink" />
						<FormControlLabel value="yellow" control={<Radio />} label="Yellow" />
						<FormControlLabel value="purple" control={<Radio />} label="Purple" />
						<FormControlLabel value="blue" control={<Radio />} label="Blue" />
					</RadioGroup>
				</Box>

				{/* Filters row */}
				<Box className="controls">
					{/* Search box */}
					<Box className="control-item search-box">
						<TextField
							label="Search by name"
							variant="outlined"
							onChange={handleSearchChange}
							fullWidth
						/>
						<IconButton disabled sx={{ color: "primary.main" }}>
							<SearchIcon />
						</IconButton>
					</Box>

					{/* City dropdown */}
					<Box className="control-item">
						<FormControl sx={{ minWidth: 250 }} variant="outlined">
							<InputLabel>City</InputLabel>
							<Select
								value={selectedCity}
								onChange={(e) => setSelectedCity(e.target.value)}
								label="City"
							>
								<MenuItem value="">All Cities</MenuItem>
								{[...new Set(users.map((u) => u.address.city))].map((city) => (
									<MenuItem key={city} value={city}>
										{city}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					</Box>

					{/* Highlight oldest checkbox */}
					<Box className="control-item">
						<FormControlLabel
							control={
								<Checkbox
									checked={highlightOldest}
									onChange={(e) => setHighlightOldest(e.target.checked)}
								/>
							}
							label="Highlight Oldest per City"
						/>
					</Box>
				</Box>

				{/* Table */}
				{loading ? (
					<Typography variant="body1" align="center">
						Loading users...
					</Typography>
				) : (
					<TableContainer component={Paper}>
						<Table>
							{/* Dynamically color the header */}
							<TableHead
								sx={{
									backgroundColor: "primary.main",
									"& .MuiTableCell-head": {
										color: "#fff",
										fontWeight: "bold",
									},
								}}
							>
								<TableRow>
									<TableCell align="center">ID</TableCell>
									<TableCell>Name</TableCell>
									<TableCell>City</TableCell>
									<TableCell>Birth Date</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{filteredUsers.map((user) => {
									const isOldest = oldestUsersPerCity.get(user.address.city)?.id === user.id;
									return (
										<TableRow
											key={user.id}
											sx={{
												backgroundColor: highlightOldest && isOldest
													? alpha(colorMap[themeColor], 0.15) // 15% tinted highlight
													: "inherit",
											}}
										>
											<TableCell align="center">{user.id}</TableCell>
											<TableCell>
												{user.firstName} {user.lastName}
											</TableCell>
											<TableCell>{user.address.city}</TableCell>
											<TableCell>{user.birthDate}</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</TableContainer>
				)}

				{/* Total User Count */}
				{!loading && (
					<Typography variant="body2" className="user-count">
						Total Users: {filteredUsers.length}
					</Typography>
				)}
			</Container>
		</ThemeProvider>
	);
}

export default App;

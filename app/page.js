'use client'

import  { useState, useEffect } from 'react'
import { firestore } from "@/firebase";
import { Box, Stack, TextField, Typography, Modal, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";
import { collection, deleteDoc, doc, getDocs, query, setDoc, getDoc } from "firebase/firestore";


export default function Home() {
  // For inventory management
  const [inventory, setInventory] = useState([])

  // state var for portal to remove and add items
  const [open, setOpen] = useState(false)

  // Var to set item properties
  const [ itemName, setItemName] = useState('')
  const [ itemQuant, setItemQuant] = useState(0)
  const [ itemCal, setItemCal] = useState(0)

  const [ searchName, setSearchName ] = useState('')



  // Fire base fetching  from database 
  // Done as async so website doesnt freeze
  const fetchInventory = async (displayList) => {
    if (displayList == null){
      // getting Collection named : digestables
      const snapshot = query(collection(firestore, 'digestables'))
      // Getting all docs in collection
      const documents = await getDocs(snapshot)

      const inventoryList = []

      // Add all records in the collection to 'inventoryList' var
      documents.forEach((doc) => {
        inventoryList.push({
          name: doc.id,
          ...doc.data(),
        })
      })

      setInventory(inventoryList)
    } else {
      setInventory(displayList)
    }
  } 


  const removeItem  = async (item) => {
    const docRef = doc(collection(firestore, 'digestables'), item)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const {quantity, calories} = docSnap.data()

      if (quantity <= 1){
        await deleteDoc(docRef)
      } else {
        await setDoc(docRef, {quantity: quantity-1, calories: calories})
      }
    }
    fetchInventory()
  }

  
  const AddEditItem  = async (itemName, itemQuant, itemCal) => {
    // queying to check if it exists
    const docRef = doc(collection(firestore, 'digestables'), itemName)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists() && itemQuant <= 0){
      await deleteDoc(docRef)
    } else {
      await setDoc(docRef, {quantity: itemQuant, calories: itemCal})
    }
    fetchInventory()
  }

  // Adding 1 item quantity to collection
  const addItem  = async (itemName) => {
    // querying to check if it exists
    const docRef = doc(collection(firestore, 'digestables'), itemName)
    const docSnap = await getDoc(docRef)

    // Pulling quantity to increment
    const { calories, quantity } = docSnap.data()
    await setDoc(docRef, {quantity: quantity+1, calories: calories})
    fetchInventory()
  }

  //Search functionality
  const searchItem = async (searchVal) => {
    if (searchVal == null || searchVal == ""){
      fetchInventory()
    } else {
      const searchResults = inventory.filter(item => item.name.toLowerCase().includes(searchVal.toLowerCase()));

      fetchInventory(searchResults)
    }
  }


  // This is use to run the firebase fetch once on load
  useEffect(() => {
      fetchInventory()
    }, []
  );

  // Model helper functions for Add/Edit pop up 
  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)


  return (
    // Creating Add item Pop box
    <Box 
      width={"100vw"} height={"100vh"} display="flex" justifyContent="center"
      alignItems="center"
      gap={10}
      spacing={10}>
      <Modal open={open} onClose={handleClose}>
        <Box position={"absolute"} top={"50%"} left={"50%"} width={400} bgcolor={"white"} border={"2px solid #000"}
        boxShadow={16} p={6} display="flex" flexDirection="column" gap={3}
        sx = {
          {transform: 'translate(-50%, -50%)'}
        }>
          <Typography variant="h6">Add/Edit Item</Typography>
          <Stack width="100%" display="flex" alignItems={"center"} direction="row" spacing={2}>
            <Typography variant="h8" >Name</Typography>
            <TextField variant="standard"  fullWidth value={itemName}
            onChange={(e)=>{setItemName(e.target.value)}} />
          </Stack>
          <Stack width="100%" display="flex" alignItems={"center"} direction="row" spacing={2}>
            <Typography variant="h8" >Quantity</Typography>
            <TextField variant="standard"  fullWidth value={itemQuant}
            onChange={(e)=>{setItemQuant(e.target.value)}}  type="number" InputProps={{
              inputProps: { min: 0 }
            }}/>
          </Stack>
          <Stack width="100%" display="flex" alignItems={"center"} direction="row" spacing={2}>
            <Typography variant="h8" >Calories</Typography>
            <TextField variant="standard"  fullWidth value={itemCal}
            onChange={(e)=>{setItemCal(e.target.value)}}  type="number" InputProps={{
              inputProps: { min: 0 }
            }}/>
          </Stack>
          <Button variant="contained" onClick={() =>{
            AddEditItem(itemName, itemQuant, itemCal)
            handleClose()
            }}>Submit</Button>
        </Box>
      </Modal>


    {/* Main page  */}
    <Box display="flex" flexDirection="column"  alignItems="center" justifyContent="center">
      <Typography variant="h2" padding={5}>Inventory Management</Typography>
      {/* Creating a search engine area*/}
      <Box width="800px" display="flex" flexDirection="row" justifyContent="space-evenly" p={2} spacing={5} alignItems="center">
        <Box width={400}  height={150} bgcolor={"white"} border={"1px solid #000"}
        boxShadow={16} p={2} display="flex" flexDirection="column" gap={3}
        spacing={3}
        >
          <Typography variant="h6">Search Items</Typography>
          <Stack width="100%" direction="row" spacing={2}>
            <TextField variant="outlined"  fullWidth value={searchName}
            onChange={(f)=>{
              setSearchName(f.target.value)
            }}
            />
            <Button variant="contained" onClick={() =>searchItem(searchName)}>Search</Button>
            <Button variant="contained" onClick={() => {
              fetchInventory() 
              setSearchName("")}}
              >Cancel</Button>

          </Stack>
        </Box>
        <Button height="50px" variant="contained" onClick={() => {handleOpen()}} padding={5}> Add/Edit item</Button>
      </Box>

      <Box width="800px" height="60%vh" border="1px solid  #333" display="flex" alignItems="center" justifyContent="center" flexDirection="column">

        <Box width="800px" height="100px" border="1px solid  #333"  display="flex" alignItems="center" justifyContent="center">
          <Typography variant="h3" display="flex" >Inventory Items</Typography>
        </Box>

        <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Quantity</TableCell>
              <TableCell align="center">Item Name</TableCell>
              <TableCell align="right">Calories (kcal)</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {inventory.map((row) => (
              <TableRow
                key={row.name}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {row.quantity}
                </TableCell>
                <TableCell align="center">{row.name}</TableCell>
                <TableCell align="right">{row.calories}</TableCell>
                <TableCell align="right">
                  <Stack align="right" direction="column" spacing={2}>
                    <Button spacing={2} variant="contained" onClick={() => {addItem(row.name)}}> Add Item</Button>
                    <Button spacing={2} variant="outlined" onClick={() => {removeItem(row.name)}}> Remove Item</Button>
                  </Stack>
                </TableCell>
                {/*<TableCell align="right">{row.protein}</TableCell> */}
              </TableRow>
            ))}
          </TableBody>
          </Table>
        </TableContainer>

      </Box>
    </Box>
  </Box>
  );
// }
}
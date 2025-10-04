import { Button, ButtonGroup, Typography } from "@mui/material";
import { decrement, increment } from "./counterReducer";
import { useAppDispatch, useAppSelector } from "../../app/store/store";

export default function ContactPage() {
  const data = useAppSelector((state) => state.counter.data);
  const dispatch = useAppDispatch();
  return (
    <>
      <Typography variant="h2">Contact Page</Typography>
      <Typography variant="body1">The Data is: {data}</Typography>
      <ButtonGroup>
        <Button onClick={() => dispatch(decrement(1))}>Decrement</Button>
        <Button onClick={() => dispatch(increment(1))}>Increment</Button>
        <Button onClick={() => dispatch(increment(5))}>Increment by 5</Button>
      </ButtonGroup>
    </>
  );
}

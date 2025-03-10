import DapurList from "../components/dapurList";
import { Outlet } from "react-router-dom";

const DapurPage = () => {
  return (
    <>
      <DapurList />
      <Outlet /> {/* Ini akan merender child route */}
    </>
  );
};

export default DapurPage;

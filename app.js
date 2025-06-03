
const React = window.React;
const ReactDOM = window.ReactDOM;
const { useState, useEffect, useMemo } = React;

const App = () => {
  //--------------Table reder---------------//

  const [data, setData] = useState([]);
  const [header, setHeader] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          "https://script.google.com/macros/s/AKfycbxejicC-DhVc40W78Y9_kveg_jVru4TPrXGtUun7L1VHDOa8kUCeYvOjc1DCWIAlw/exec"
        );
        const dataSheet = await response.json();
        setData(dataSheet);
        setHeader(dataSheet[0]);
        setLoading(false);
      } catch (error) {
        console.log(error);
      }
    };
    fetchData();
    const savedErrorRow = localStorage.getItem("errorRowState");
    if (savedErrorRow) {
      setErrorRow(JSON.parse(savedErrorRow));
    }
  }, []);
  //Lọc dữ liệu
  const [filter, setFilter] = useState("");
  const filteredData = useMemo(() => {
    return data
      .slice(1)
      .filter((row) =>
        row.some((cell) =>
          String(cell).toLowerCase().includes(filter.toLowerCase())
        )
      );
  }, [data, filter]);
  //phân trang
  const [page, setPage] = useState();
  const rowsPerPage = 6;
  const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;
  //hiển thị mặc định là trang cuối cùng
  useEffect(() => {
    setPage(totalPages);
  }, [totalPages]);
  //Phân trang và render
  const pagination = useMemo(() => {
    const endIndex = filteredData.length - (totalPages - page) * rowsPerPage;
    const startIndex = endIndex - rowsPerPage;
    if (startIndex <= 0) {
      return filteredData.slice(0, rowsPerPage);
    } else {
      return filteredData.slice(startIndex, endIndex);
    }
  }, [filteredData, page, rowsPerPage]);

  //--------------Form Render------------------//

  const [formData, setFormData] = useState({});
  useEffect(() => {
    const newForm = { ...formData, action: "" };
    header.map((header) => {
      newForm[header] = "";
      setFormData(newForm);
    });
    setIndexRow("");
    setErrorClick("");
  }, [data]);
  const resetForm = () => {
    const newForm = { ...formData, action: "" };
    header.map((header) => {
      newForm[header] = "";
      setFormData(newForm);
    });
    setIndexRow("");
  };
  const [indexRow, setIndexRow] = useState("");
  const [errorClick, setErrorClick] = useState("");

  const findRow = (row, error) => {
    const newForm = { ...formData };
    header.map((header, index) => {
      newForm[header] = row[index];
      setFormData(newForm);
    });
    const index = data.findIndex((row) => row[0] === newForm["ID"]);
    setIndexRow(index);
    setErrorClick(error);
  };

  const addRow = () => {
    const maxId = data.slice(1).reduce((max, row) => Math.max(max, row[0]), 0);
    formData["ID"] = maxId + 1;
    formData["DATE"] = new Date().toLocaleString("vi-VN");
    const newRow = [];
    header.map((header, index) => {
      newRow[index] = formData[header];
    });
    setData([...data, newRow]);
    sendFormData("save", newRow);
    setErrorRow([...errorRow, [...newRow, "New"]]);
    setLoading(true);
  };
  const updateRow = () => {
    if (!indexRow) {
      alert("Chọn một hàng hợp lệ để cập nhật.");
    }
    const newRow = [];
    header.map((header, index) => {
      newRow[index] = formData[header];
    });
    const update = [...data];
    !data[indexRow] ? update.push(newRow) : (update[indexRow] = newRow);
    setData(update);
    sendFormData("save", newRow);
    setErrorRow([...errorRow, [...newRow, "Update"]]);
    setLoading(true);
  };
  const deleteRow = () => {
    if (!indexRow) {
      alert("Chọn một hàng hợp lệ để xóa.");
    }
    sendFormData("delete", data[indexRow]);
    setErrorRow([...errorRow, [...data[indexRow], "Delete"]]);
    setLoading(true);
  };

  const [errorRow, setErrorRow] = useState([]);
  useEffect(() => {
    localStorage.setItem("errorRowState", JSON.stringify(errorRow));
  }, [errorRow]);
  const [loading, setLoading] = useState(true);
  //Gửi dữ liệu tơi server save/delete
  const sendFormData = async (action, row) => {
    try {
      const data = { ...formData };
      data["action"] = action;
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbxejicC-DhVc40W78Y9_kveg_jVru4TPrXGtUun7L1VHDOa8kUCeYvOjc1DCWIAlw/exec",
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      );
      if (!response.ok) {
        throw new Error(`Lỗi HTTP! status: ${response.status}`);
        setLoading(false);
        //setErrorRow([...errorRow, row]);
      }
      const result = await response.json();
      if (result.success == true) {
        setLoading(false);
        alert(result.message);
        setErrorRow((prevErrorRow) =>
          prevErrorRow.filter((rows) => rows[0] != row[0])
        );
        action === "delete"
          ? setData((prevData) => prevData.filter((rows) => rows[0] != row[0]))
          : "";
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert("Đã có lỗi xảy ra khi gửi dữ liệu lên API");
      setLoading(false);
      //setErrorRow([...errorRow, row]);
    }
  };

  // Đây là phần chuyển đổi từ JSX sang React.createElement
  return React.createElement(
    React.Fragment,
    null,
    // Filter input
    React.createElement(
      "div",
      { style: { marginBottom: "10px" } },
      React.createElement("input", {
        type: "text",
        placeholder: "Filter Table",
        value: filter,
        onChange: (e) => setFilter(e.target.value),
      })
    ),
    // Main Table Container
    React.createElement(
      "div",
      { id: "table-container" },
      React.createElement(
        "table",
        { id: "myTable" },
        // Table Header
        header &&
          header.length > 0 &&
          React.createElement(
            // Chỉ render thead nếu có header
            "thead",
            null,
            React.createElement(
              "tr",
              null,
              header.map((headers, index) =>
                React.createElement("th", { key: index }, headers)
              )
            )
          ),
        // Table Body
        React.createElement(
          "tbody",
          null,
          pagination.map((rowData) =>
            React.createElement(
              "tr",
              {
                key: rowData[0], // Sử dụng ID làm key duy nhất
                id: rowData[0],
                onClick: () => findRow(rowData, ""),
                // Kiểm tra nếu rowData này (dựa trên ID) có trong errorRow HOẶC errorClick khớp với ID
                className:
                  errorRow.some(
                    (err) => err && err.length > 0 && err[0] === rowData[0]
                  ) || errorClick === rowData[0]
                    ? "error-row"
                    : "",
              },
              rowData.map((cellData, cellIndex) =>
                React.createElement(
                  "td",
                  { key: cellIndex },
                  React.createElement("div", { className: "cell" }, cellData)
                )
              )
            )
          )
        )
      )
    ),
    // Pagination Controls
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginTop: "10px",
        },
      },
      React.createElement(
        "button",
        { onClick: () => setPage(1), disabled: page === 1 },
        "First"
      ),
      React.createElement(
        "button",
        { onClick: () => setPage(page - 1), disabled: page === 1 },
        "Prev"
      ),
      React.createElement("span", null, page, " / ", totalPages), // span có nhiều children (biến và string)
      React.createElement(
        "button",
        { onClick: () => setPage(page + 1), disabled: page === totalPages },
        "Next"
      ),
      React.createElement(
        "button",
        { onClick: () => setPage(totalPages), disabled: page === totalPages },
        "Last"
      )
    ),
    // Error Row Table (render separately)
    loading
      ? React.createElement("p", null, "Loading...")
      : errorRow.length > 0 &&
          React.createElement(
            // Chỉ render bảng này nếu có hàng lỗi
            "table",
            null,
            errorRow.map((rowData, rowIndex) =>
              React.createElement(
                "tr",
                {
                  key: rowData[0] || rowIndex, // Sử dụng ID làm key nếu có, fallback về index
                  onClick: () => findRow(rowData, rowData[0]),
                  className: "error-row",
                },
                React.createElement("td", null, rowData[6]), // Cột action
                React.createElement("td", null, rowData[0]), // Cột ID
                React.createElement("td", null, rowData[2]) // Cột thứ 3 (index 2)
              )
            )
          ),

    // Form and Action Buttons
    React.createElement(
      "div",
      null,
      // Conditional paragraph (New ID or Current ID/DATE)
      !indexRow
        ? React.createElement(
            "p",
            null,
            "New ID: ",
            data.slice(1).reduce((max, row) => Math.max(max, row[0]), 0) + 1
          )
        : React.createElement(
            "p",
            null,
            "ID:",
            formData["ID"],
            " - ", // Khoảng trắng
            "DATE:",
            formData["DATE"],
            " ", // Khoảng trắng
            React.createElement("button", { onClick: resetForm }, "Clear")
          ),

      // The Form
      header &&
        header.length > 0 &&
        React.createElement(
          // Chỉ render form nếu có header
          "form",
          { id: "myForm" },
          header.map((head, index) =>
            React.createElement(
              "div",
              { key: index },
              React.createElement("label", { htmlFor: head }, head + ":"), // Thêm ":" cho label
              React.createElement("textarea", {
                // Sử dụng textarea như code gốc
                type: "text", // type="text" cho textarea không có tác dụng, chỉ dùng id, name, value, onChange
                id: head,
                name: head,
                value: formData[head] || "", // Đảm bảo có giá trị mặc định rỗng nếu undefined
                onChange: (e) =>
                  setFormData({ ...formData, [head]: e.target.value }),
              })
            )
          )
        ),
      // Action Buttons Div
      React.createElement(
        "div",
        null,
        React.createElement(
          "button",
          { onClick: addRow },
          !indexRow || !data[indexRow] ? "Tạo Mới" : "New copy" // Nội dung button phụ thuộc vào indexRow
        ),
        React.createElement(
          "button",
          { onClick: updateRow, disabled: !indexRow }, // Disabled nếu không có hàng được chọn (indexRow rỗng/0)
          "Cập Nhật"
        ),
        React.createElement(
          "button",
          { onClick: deleteRow, disabled: !indexRow || !data[indexRow] }, // Disabled nếu không có hàng được chọn (indexRow rỗng/0)
          "xóa"
        )
      )
    )
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(App, null)); 

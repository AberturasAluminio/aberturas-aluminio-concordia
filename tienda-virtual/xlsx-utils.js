(function () {
  function xmlEscape(value) {
    return String(value ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").replace(/[<>&'"]/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[char]);
  }

  function columnName(index) {
    let name = "";
    for (let current = index + 1; current > 0; current = Math.floor((current - 1) / 26)) name = String.fromCharCode(65 + ((current - 1) % 26)) + name;
    return name;
  }

  function crc32(bytes) {
    let crc = -1;
    for (const byte of bytes) {
      crc ^= byte;
      for (let i = 0; i < 8; i += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
    return (crc ^ -1) >>> 0;
  }

  const uint16 = (output, value) => output.push(value & 255, (value >>> 8) & 255);
  const uint32 = (output, value) => output.push(value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255);

  function zipStore(files) {
    const encoder = new TextEncoder();
    const output = [];
    const central = [];
    let offset = 0;
    files.forEach((file) => {
      const name = encoder.encode(file.name);
      const data = encoder.encode(file.content);
      const crc = crc32(data);
      const local = [];
      uint32(local, 0x04034b50); uint16(local, 20); uint16(local, 0); uint16(local, 0); uint16(local, 0); uint16(local, 0);
      uint32(local, crc); uint32(local, data.length); uint32(local, data.length); uint16(local, name.length); uint16(local, 0);
      output.push(...local, ...name, ...data);
      const entry = [];
      uint32(entry, 0x02014b50); uint16(entry, 20); uint16(entry, 20); uint16(entry, 0); uint16(entry, 0); uint16(entry, 0); uint16(entry, 0);
      uint32(entry, crc); uint32(entry, data.length); uint32(entry, data.length); uint16(entry, name.length); uint16(entry, 0); uint16(entry, 0);
      uint16(entry, 0); uint16(entry, 0); uint32(entry, 0); uint32(entry, offset);
      central.push(...entry, ...name);
      offset = output.length;
    });
    const centralOffset = output.length;
    output.push(...central);
    const end = [];
    uint32(end, 0x06054b50); uint16(end, 0); uint16(end, 0); uint16(end, files.length); uint16(end, files.length);
    uint32(end, central.length); uint32(end, centralOffset); uint16(end, 0);
    output.push(...end);
    return new Uint8Array(output);
  }

  function workbookXml(rows) {
    const sheetData = rows.map((row, rowIndex) => `<row r="${rowIndex + 1}">${row.map((value, columnIndex) => {
      const ref = `${columnName(columnIndex)}${rowIndex + 1}`;
      return typeof value === "number" && Number.isFinite(value)
        ? `<c r="${ref}"><v>${value}</v></c>`
        : `<c r="${ref}" t="inlineStr"><is><t>${xmlEscape(value)}</t></is></c>`;
    }).join("")}</row>`).join("");
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="18"/><cols><col min="1" max="1" width="16" customWidth="1"/><col min="2" max="2" width="30" customWidth="1"/><col min="3" max="4" width="35" customWidth="1"/><col min="5" max="7" width="24" customWidth="1"/><col min="8" max="8" width="16" customWidth="1"/><col min="9" max="9" width="40" customWidth="1"/></cols><sheetData>${sheetData}</sheetData><autoFilter ref="A1:I${Math.max(1, rows.length)}"/></worksheet>`;
  }

  function download(filename, rows) {
    const files = [
      { name: "[Content_Types].xml", content: `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>` },
      { name: "_rels/.rels", content: `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
      { name: "xl/workbook.xml", content: `<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Productos" sheetId="1" r:id="rId1"/></sheets></workbook>` },
      { name: "xl/_rels/workbook.xml.rels", content: `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>` },
      { name: "xl/styles.xml", content: `<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Arial"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Arial"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF123A63"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" applyFill="1" applyFont="1"/></cellXfs></styleSheet>` },
      { name: "xl/worksheets/sheet1.xml", content: workbookXml(rows).replace('<row r="1">', '<row r="1" s="1" customFormat="1">').replaceAll(/<c r="([A-I])1"/g, '<c r="$11" s="1"') },
    ];
    const blob = new Blob([zipStore(files)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function inflateRaw(bytes) {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  async function unzip(buffer) {
    const bytes = new Uint8Array(buffer);
    const files = {};
    const decoder = new TextDecoder();
    for (let i = 0; i < bytes.length - 30;) {
      if (bytes[i] !== 0x50 || bytes[i + 1] !== 0x4b || bytes[i + 2] !== 0x03 || bytes[i + 3] !== 0x04) { i += 1; continue; }
      const method = bytes[i + 8] | (bytes[i + 9] << 8);
      const compressedSize = (bytes[i + 18] | (bytes[i + 19] << 8) | (bytes[i + 20] << 16) | (bytes[i + 21] << 24)) >>> 0;
      const nameLength = bytes[i + 26] | (bytes[i + 27] << 8);
      const extraLength = bytes[i + 28] | (bytes[i + 29] << 8);
      const nameStart = i + 30;
      const dataStart = nameStart + nameLength + extraLength;
      const name = decoder.decode(bytes.slice(nameStart, nameStart + nameLength));
      const data = bytes.slice(dataStart, dataStart + compressedSize);
      const content = method === 8 ? await inflateRaw(data) : data;
      files[name] = decoder.decode(content);
      i = dataStart + compressedSize;
    }
    return files;
  }

  function rowsFromXml(sheetXml, sharedXml = "") {
    const shared = [];
    if (sharedXml) {
      const sharedDoc = new DOMParser().parseFromString(sharedXml, "application/xml");
      sharedDoc.querySelectorAll("si").forEach((node) => shared.push(node.textContent || ""));
    }
    const doc = new DOMParser().parseFromString(sheetXml, "application/xml");
    return [...doc.querySelectorAll("sheetData row")].map((row) => {
      const values = [];
      row.querySelectorAll("c").forEach((cell) => {
        const ref = cell.getAttribute("r") || "A1";
        const column = ref.replace(/[0-9]/g, "");
        const index = [...column].reduce((sum, char) => sum * 26 + char.charCodeAt(0) - 64, 0) - 1;
        const type = cell.getAttribute("t");
        const raw = cell.querySelector("v")?.textContent ?? cell.querySelector("t")?.textContent ?? "";
        values[index] = type === "s" ? shared[Number(raw)] || "" : raw;
      });
      return values.map((value) => value ?? "");
    });
  }

  async function read(file) {
    const files = await unzip(await file.arrayBuffer());
    const sheet = files["xl/worksheets/sheet1.xml"];
    if (!sheet) throw new Error("No se encontró la primera hoja del archivo.");
    return rowsFromXml(sheet, files["xl/sharedStrings.xml"]);
  }

  window.XlsxUtils = { download, read };
})();

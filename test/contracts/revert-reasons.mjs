import assert from 'node:assert/strict';

// Expected externally observable require reasons for the B contract.
const reasons = {
  KhongPhaiAdmin: /^Khong phai admin$/,
  GiangVienChuaDuocDuyet: /^Giang vien chua duoc duyet$/,
  DiaChiViKhongHopLe: /^Dia chi vi khong hop le$/,
  GiangVienDaDuocDuyet: /^Giang vien da duoc duyet$/,
  TenHocPhanKhongHopLe: /^Ten hoc phan (rong|qua dai|chi co khoang trang)$/,
  LopKhongTonTai: /^Lop khong ton tai$/,
  DaThamGiaLop: /^Da tham gia lop$/,
  ChuaThamGiaLop: /^Chua tham gia lop$/,
  DaDanhGiaLop: /^Da danh gia lop$/,
  CongDanhGiaDangDong: /^Cong danh gia dang dong$/,
  DiemKhongHopLe: /^Diem phai tu 1 den 5$/,
  NhanXetKhongHopLe: /^Nhan xet (rong|qua dai|chi co khoang trang)$/,
  ChiSoNhanXetKhongHopLe: /^Chi so nhan xet khong hop le$/,
  KhongCoQuyenQuanLyLop: /^Khong co quyen quan ly lop$/,
  DanhSachViKhongHopLe: /^Danh sach vi phai co tu 1 den 100 dia chi$/,
  ChuaDuocCapQuyenVaoLop: /^Chua duoc cap quyen vao lop$/,
};
export function assertRevertReason(contract, error, name) {
  assert.equal(error.code, 'CALL_EXCEPTION');
  const decoded = contract.interface.parseError(error.data);
  assert.equal(decoded.name, 'Error');
  assert.ok(reasons[name], `Unknown expected failure: ${name}`);
  assert.match(decoded.args[0], reasons[name]);
  return true;
}

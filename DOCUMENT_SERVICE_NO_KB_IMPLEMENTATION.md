# DocumentService Enhancement - No Knowledge Base ID Required

## Overview

ได้สร้าง DocumentService ใหม่ที่สามารถทำงานได้โดยไม่ต้องใช้ `knowledgeBaseId` และเชื่อมต่อกับหน้า Documents Page แล้ว

## การเปลี่ยนแปลงที่ทำ

### 1. DocumentService - เพิ่มเมธอดใหม่

สร้างเมธอดใหม่ใน `services/DocumentService/index.ts`:

#### `getAllUserDocuments(paginationOptions, filters)`

- ดึงเอกสารทั้งหมดของผู้ใช้ปัจจุบันโดยไม่ต้องใช้ `knowledgeBaseId`
- ใช้ JOIN กับ `knowledge_base` table เพื่อตรวจสอบ ownership
- รองรับ pagination และ filters (status, type, searchTerm)
- ตัวอย่างการใช้งาน:

```typescript
const result = await documentService.getAllUserDocuments(paginationOptions, {
  status: "all",
  searchTerm: "document name",
  type: "pdf",
});
```

#### `searchAllUserDocuments(query, paginationOptions)`

- ค้นหาเอกสารทั้งหมดของผู้ใช้โดยไม่ต้องใช้ `knowledgeBaseId`
- ค้นหาใน field `name` และ `content`
- รองรับ pagination
- ตัวอย่างการใช้งาน:

```typescript
const result = await documentService.searchAllUserDocuments(
  "search term",
  paginationOptions,
);
```

#### `getUserDocument(documentId)`

- ดึงเอกสารตาม ID โดยตรวจสอบ ownership ผ่าน knowledge_base
- คืนค่า null หากไม่พบหรือไม่มีสิทธิ์
- ตัวอย่างการใช้งาน:

```typescript
const document = await documentService.getUserDocument("doc-id");
```

### 2. Hook ใหม่ - useAllUserDocuments

สร้าง custom hook ใหม่ใน `hooks/useAllUserDocuments.tsx`:

#### คุณสมบัติ:

- Auto-load documents เมื่อ component mount
- Pagination support
- Search functionality
- Filter by status และ type
- Tab counts (all, uploaded, processing, synced, error)
- Loading states และ error handling

#### การใช้งาน:

```typescript
const {
  documents,
  filteredDocuments,
  loading,
  totalPages,
  currentPage,
  searchDocuments,
  setSearchTerm,
  handlePageChange,
} = useAllUserDocuments({
  autoLoad: true,
  itemsPerPage: 10,
});
```

### 3. Documents Page Integration

อัปเดต `app/(main)/documents/page.tsx`:

#### การเปลี่ยนแปลง:

- เปลี่ยนจาก `useDocuments` เป็น `useAllUserDocuments`
- ลบการพึ่งพา `knowledgeBaseId`
- เชื่อมต่อกับ service ใหม่
- คงการทำงานเดิมของ UI ไว้ทั้งหมด

#### ผลลัพธ์:

- หน้า Documents จะแสดงเอกสารทั้งหมดของผู้ใช้
- ไม่ต้องเลือก Knowledge Base ก่อน
- ยังคงมี search, filter, pagination เหมือนเดิม

### 4. Hook Export

อัปเดต `hooks/index.ts`:

- เพิ่ม export สำหรับ `useAllUserDocuments`

### 5. Example Usage

สร้าง `examples/DocumentServiceExample.tsx`:

- ตัวอย่างการใช้งาน DocumentService แบบ direct call
- ตัวอย่างการใช้งาน useAllUserDocuments hook
- แสดงความแตกต่างระหว่างสองวิธี

## Security Features

### User Ownership Protection

- ใช้ JOIN กับ `knowledge_base` table
- ตรวจสอบ `created_by` field
- ป้องกันการเข้าถึงเอกสารของผู้ใช้อื่น

### Query Examples

```sql
-- การ JOIN เพื่อตรวจสอบ ownership
SELECT document.*, knowledge_base.name as kb_name
FROM document
INNER JOIN knowledge_base ON document.knowledge_base_id = knowledge_base.id
WHERE knowledge_base.created_by = 'user-id'
```

## Benefits

1. **ความยืดหยุ่น**: ไม่ต้องพึ่งพา Knowledge Base ID
2. **ประสิทธิภาพ**: ใช้ JOIN แทนการ query แยก
3. **ความปลอดภัย**: ตรวจสอบ ownership อัตโนมัติ
4. **การใช้งาน**: API ที่สะอาดและชัดเจน
5. **Backward Compatibility**: เมธอดเดิมยังใช้งานได้

## Files Changed

- `services/DocumentService/index.ts` - เพิ่มเมธอดใหม่
- `hooks/useAllUserDocuments.tsx` - Hook ใหม่
- `hooks/index.ts` - Export hook ใหม่
- `app/(main)/documents/page.tsx` - เชื่อมต่อกับ service ใหม่
- `examples/DocumentServiceExample.tsx` - ตัวอย่างการใช้งาน

## การทดสอบ

เพื่อทดสอบการทำงาน:

1. เข้าไปที่หน้า `/documents`
2. ตรวจสอบว่าเอกสารทั้งหมดของผู้ใช้แสดงขึ้น
3. ทดสอบการค้นหา
4. ทดสอบ pagination
5. ตรวจสอบว่าแสดงเฉพาะเอกสารของผู้ใช้ปัจจุบัน

## Note

การ implement นี้ยังคงรักษา backward compatibility กับเมธอดเดิมที่ใช้ `knowledgeBaseId` และเพิ่มความสามารถใหม่ที่ไม่ต้องพึ่งพา Knowledge Base ID

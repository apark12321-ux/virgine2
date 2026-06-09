import { db, auth } from "./firebase";
import { doc, getDoc, getDocs, collection, query, where, documentId, runTransaction } from "firebase/firestore";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * 조회수 헬퍼 (Firebase Firestore 기반 실시간 조회수)
 *
 * - recordView(id): 글 진입·새로고침할 때마다 조회수 1 증가 (Firestore Transaction)
 * - fetchAllViews(ids): 여러 글 조회수를 한 번에 읽어 카드·목록에 표시
 * - 카운터 미설정(오류) 시 조회수는 숨김 — 가짜 숫자를 만들지 않음
 */

/** 글 조회 시 호출 — 호출(새로고침)할 때마다 1 증가. 반환: 최신 조회수 또는 null(오류). */
export async function recordView(postId: string): Promise<number | null> {
  if (!postId) return null;

  try {
    const docRef = doc(db, "views", postId);
    
    // Firestore 트랜잭션을 사용하여 안전하게 1을 증가시키고 최신값을 즉시 반환받습니다.
    const newViews = await runTransaction(db, async (transaction) => {
      const sfDoc = await transaction.get(docRef);
      if (!sfDoc.exists()) {
        transaction.set(docRef, { count: 1 });
        return 1;
      }
      const newCount = (sfDoc.data().count || 0) + 1;
      transaction.update(docRef, { count: newCount });
      return newCount;
    });
    
    return newViews;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `views/${postId}`);
    return null;
  }
}

/** 여러 글 조회수를 { id: count }로 읽기. 실패 시 빈 객체(조회수 숨김). */
export async function fetchAllViews(ids: string[] = []): Promise<Record<string, number>> {
  if (ids.length === 0) return {};
  
  try {
    const result: Record<string, number> = {};
    
    // Document ID 'in' 필터는 최대 30개 컬렉션으로 제한되므로, 30개씩 분할하여 가져옵니다.
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += 30) {
      chunks.push(ids.slice(i, i + 30));
    }
    
    await Promise.all(
      chunks.map(async (chunk) => {
        try {
          const q = query(collection(db, "views"), where(documentId(), "in", chunk));
          const snap = await getDocs(q);
          snap.forEach((doc) => {
            result[doc.id] = doc.data().count || 0;
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.LIST, "views");
        }
      })
    );
    
    // 가져오지 못한 id들에 대해서는 기본값 0 채우기
    ids.forEach((id) => {
      if (!(id in result)) {
        result[id] = 0;
      }
    });
    
    return result;
  } catch (error) {
    console.error("Failed to fetch views from Firestore:", error);
    return {};
  }
}

/** 단일 글 조회수 읽기. */
export async function fetchView(postId: string): Promise<number | null> {
  if (!postId) return null;
  try {
    const snap = await getDoc(doc(db, "views", postId));
    return snap.exists() ? (snap.data().count || 0) : 0;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `views/${postId}`);
    return null;
  }
}

/** 조회수 표시 포맷: 1234 → "1.2천", 12345 → "1.2만" */
export function formatViews(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1).replace(/\.0$/, "")}만`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}천`;
  return n.toLocaleString();
}



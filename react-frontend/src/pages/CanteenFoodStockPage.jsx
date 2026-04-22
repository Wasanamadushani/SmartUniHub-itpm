import { useEffect, useMemo, useState } from "react";
import { FiLoader, FiRefreshCw, FiSearch, FiBox } from "react-icons/fi";
import RequestFoodModal from "../components/canteen/RequestFoodModal";
import { createFoodRequest, getFoods, getMyRequests, getUsers, mockUsers } from "../lib/canteenApi";
import { useCanteen } from "../context/CanteenContext";

const REQUEST_LOCK_MESSAGE = "You already have an active request. Wait until helper confirms payment before creating a new food request.";

const isLatestRequestBlocking = (requests = []) => {
  if (!Array.isArray(requests) || requests.length === 0) return false;

  const latestRequest = requests.reduce((latest, current) => {
    const latestTime = new Date(latest?.createdAt || 0).getTime();
    const currentTime = new Date(current?.createdAt || 0).getTime();
    return currentTime > latestTime ? current : latest;
  }, requests[0]);

  const status = String(latestRequest?.status || "").toUpperCase();
  const paymentStatus = String(latestRequest?.paymentStatus || "").toUpperCase();
  const hasPaymentRecord = Boolean(latestRequest?.paymentId);

  if (["OPEN", "ASSIGNED", "PICKED", "DELIVERED"].includes(status)) return true;
  if (status === "COMPLETED" && hasPaymentRecord && paymentStatus !== "COMPLETED") return true;
  return false;
};

const CanteenFoodStockPage = () => {
  const { selectedCanteen } = useCanteen();
  const [foods, setFoods] = useState([]);
  const [search, setSearch] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [loadingFoods, setLoadingFoods] = useState(true);
  const [selectedBuyFood, setSelectedBuyFood] = useState(null);
  const [users, setUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [requestLock, setRequestLock] = useState({ blocked: false, message: "" });

  const filteredFoods = useMemo(() => {
    return foods.filter((food) => {
      const matchesSearch = food.name.toLowerCase().includes(search.toLowerCase());
      const matchesAvailability = availableOnly ? food.inStock : true;
      return matchesSearch && matchesAvailability;
    });
  }, [foods, search, availableOnly]);

  const currentUser = useMemo(
    () => users.find((user) => String(user._id) === String(currentUserId)) || null,
    [users, currentUserId]
  );

  const helperOptions = useMemo(
    () => users.filter((user) => user.role !== "admin" && String(user._id) !== String(currentUser?._id)),
    [users, currentUser]
  );

  const canteenSlug = useMemo(() => {
    const name = String(selectedCanteen?.name || selectedCanteen?.id || "").toLowerCase();
    if (name.includes("basement")) return "basement";
    if (name.includes("anohana")) return "anohana";
    return "anohana";
  }, [selectedCanteen]);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    window.setTimeout(() => setAlert({ type: "", message: "" }), 2800);
  };

  const loadFoods = async (silent = false) => {
    if (!silent) setLoadingFoods(true);
    try {
      const response = await getFoods(canteenSlug);
      setFoods(response.data || []);
    } catch (error) {
      console.error("Error loading foods:", error);
      setFoods([]);
    } finally {
      if (!silent) setLoadingFoods(false);
    }
  };

  useEffect(() => {
    loadFoods();
    const interval = setInterval(() => loadFoods(true), 5000);
    return () => clearInterval(interval);
  }, [canteenSlug]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersResponse = await getUsers();
        const apiUsers = (usersResponse.data || []).filter((user) => user.role !== "admin");
        if (apiUsers.length) {
          setUsers(apiUsers);
          const storedCurrentUser = JSON.parse(window.localStorage.getItem("currentUser") || "null");
          const preferredId = storedCurrentUser?._id;
          const resolvedUserId = apiUsers.some((user) => String(user._id) === String(preferredId))
            ? preferredId
            : apiUsers[0]._id;
          setCurrentUserId(resolvedUserId);
        } else {
          setUsers(mockUsers);
          const storedCurrentUser = JSON.parse(window.localStorage.getItem("currentUser") || "null");
          const preferredId = storedCurrentUser?._id;
          const resolvedUserId = mockUsers.some((user) => String(user._id) === String(preferredId))
            ? preferredId
            : mockUsers[0]._id;
          setCurrentUserId(resolvedUserId);
        }
      } catch {
        setUsers(mockUsers);
        const storedCurrentUser = JSON.parse(window.localStorage.getItem("currentUser") || "null");
        const preferredId = storedCurrentUser?._id;
        const resolvedUserId = mockUsers.some((user) => String(user._id) === String(preferredId))
          ? preferredId
          : mockUsers[0]._id;
        setCurrentUserId(resolvedUserId);
      }
    };
    loadUsers();
  }, []);

  useEffect(() => {
    const syncRequestLock = async () => {
      if (!currentUser?._id) {
        setRequestLock({ blocked: false, message: "" });
        return;
      }
      try {
        const response = await getMyRequests(currentUser._id);
        const myRequests = response.data || [];
        const hasBlockingRequest = isLatestRequestBlocking(myRequests);
        setRequestLock(
          hasBlockingRequest
            ? {
                blocked: true,
                message: REQUEST_LOCK_MESSAGE,
              }
            : { blocked: false, message: "" }
        );
      } catch {
        // Keep request flow available if lock status cannot be loaded.
        setRequestLock({ blocked: false, message: "" });
      }
    };

    syncRequestLock();
    const interval = window.setInterval(syncRequestLock, 4000);
    return () => window.clearInterval(interval);
  }, [currentUser?._id]);

  const handleSendRequest = async ({ requesterId, quantity, message }) => {
    if (!selectedBuyFood || !currentUser?._id) return;

    try {
      const response = await getMyRequests(currentUser._id);
      const myRequests = response.data || [];
      if (isLatestRequestBlocking(myRequests)) {
        setRequestLock({ blocked: true, message: REQUEST_LOCK_MESSAGE });
        showAlert("error", REQUEST_LOCK_MESSAGE);
        return;
      }
    } catch {
      // Ignore lock refresh failure and continue to server-side enforcement.
    }

    if (requestLock.blocked) {
      showAlert("error", requestLock.message);
      return;
    }
    setSubmitting(true);
    try {
      await createFoodRequest({
        requesterId: requesterId || currentUser._id,
        foodItem: selectedBuyFood.name,
        quantity,
        note: message,
        canteen: canteenSlug,
      });
      setSelectedBuyFood(null);
      showAlert("success", "Buy help request sent. A nearby friend can accept it.");
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || "Failed to send buy request. Please try again.";
      showAlert("error", message);
    } finally {
      setSubmitting(false);
    }
  };

  const inStockCount = foods.filter((food) => food.inStock).length;
  const outOfStockCount = Math.max(foods.length - inStockCount, 0);
  const averagePrice = foods.length
    ? foods.reduce((sum, food) => sum + Number(food.price || 0), 0) / foods.length
    : 0;

  return (
    <section className="section-block">
      <div className="container canteenpro-shell">
        {alert.message ? (
          <div className={`surface canteenpro-alert ${alert.type === "success" ? "ok" : "error"}`}>
            <p>{alert.message}</p>
          </div>
        ) : null}

        {requestLock.blocked ? (
          <div className="surface canteenpro-alert error">
            <p>{requestLock.message}</p>
          </div>
        ) : null}

        <article className="surface canteenpro-hero canteenpro-hero-food">
          <div>
            <p className="canteenpro-kicker">Food Catalog</p>
            <h2>{selectedCanteen?.name || "Campus Canteen"} Daily Menu</h2>
            <p>Browse available food items, compare prices, and instantly send a buy-help request to your trusted friends.</p>
          </div>
          <div className="canteenpro-stat-grid">
            <div className="canteenpro-stat-card"><strong>{foods.length}</strong><span>Total Items</span></div>
            <div className="canteenpro-stat-card"><strong>{inStockCount}</strong><span>In Stock</span></div>
            <div className="canteenpro-stat-card"><strong>{outOfStockCount}</strong><span>Out of Stock</span></div>
            <div className="canteenpro-stat-card"><strong>LKR {averagePrice.toFixed(0)}</strong><span>Avg Price</span></div>
          </div>
        </article>

        <article className="surface canteenpro-toolbar">
          <label>
            <span>Search Items</span>
            <div className="canteenpro-input-wrap">
              <FiSearch />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by food name"
              />
            </div>
          </label>

          <div className="canteenpro-toolbar-actions">
            <label className="canteenpro-check">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(event) => setAvailableOnly(event.target.checked)}
              />
              <span>Show only available items</span>
            </label>
            <button type="button" className="button button-ghost button-small" onClick={() => loadFoods()}>
              <FiRefreshCw />
              Refresh
            </button>
          </div>
        </article>

        <article className="surface canteenpro-panel">
          <div className="canteenpro-panel-head">
            <h3><FiBox /> Available Foods</h3>
            <p>{filteredFoods.length} item(s) matching your filter</p>
          </div>

          {loadingFoods ? (
            <div className="canteenpro-empty">
              <FiLoader className="spin" />
              <p>Loading food catalog...</p>
            </div>
          ) : filteredFoods.length === 0 ? (
            <div className="canteenpro-empty">
              <FiBox />
              <p>No food items found for current filters.</p>
            </div>
          ) : (
            <div className="canteenpro-food-grid">
              {filteredFoods.map((food) => (
                <article key={food._id} className="canteenpro-food-card">
                  <div className="canteenpro-food-image-wrap">
                    <img
                      src={food.image}
                      alt={food.name}
                      onError={(event) => {
                        event.currentTarget.src = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80";
                      }}
                    />
                    <span className={`canteenpro-pill ${food.inStock ? "in" : "out"}`}>
                      {food.inStock ? "In Stock" : "Out of Stock"}
                    </span>
                  </div>
                  <div className="canteenpro-food-body">
                    <h4>{food.name}</h4>
                    <p className="canteenpro-price">LKR {Number(food.price).toFixed(2)}</p>
                    <button
                      type="button"
                      className="button button-small button-primary"
                      onClick={() => setSelectedBuyFood(food)}
                      disabled={!food.inStock || requestLock.blocked}
                    >
                      Request Buy Help
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </article>
      </div>

      <RequestFoodModal
        isOpen={Boolean(selectedBuyFood)}
        selectedFood={selectedBuyFood}
        requesters={users}
        defaultRequesterId={currentUserId}
        currentUserDetails={currentUser}
        friends={helperOptions}
        onClose={() => setSelectedBuyFood(null)}
        onSubmit={handleSendRequest}
      />

      {submitting ? (
        <div className="canteenpro-floating-loader">
          <FiLoader className="spin" />
          Sending buy request...
        </div>
      ) : null}
    </section>
  );
};

export default CanteenFoodStockPage;

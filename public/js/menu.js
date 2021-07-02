const originalTitle = document.title;
function updatePageTitle(title) {
  document.title = `${title} | ${originalTitle}`;
}

const pivot = document.querySelector(".pivot");
pivot.addEventListener("changed", function (event) {
  updatePageTitle(event.detail.title);
});

new window.Pivot({});

$(function() {
  $("#menu").delegate("[id^=menu-]", "click", function(ev) {
    $("#menu").find(".pure-menu-selected").removeClass("pure-menu-selected");
    $(ev.target).parent("li").addClass("pure-menu-selected");
    $("#main").find(".active").removeClass("active");
    return $("#main").find("#" + $(ev.target).attr("data-open")).addClass("active");
  });
  return $("#menuLink").click(function() {
    $("#layout").toggleClass("active");
    $("#menu").toggleClass("active");
    return $("#menuLink").toggleClass("active");
  });
});

var calendar = $("#calendar").calendar(
{
  view: "month",
  tmpl_path: "/tmpls/",
  modal_title: function(event) { return event.title },
  modal: "#events-modal",
  modal_type: "template",
  events_source: function () { return [
    {
      "id": 293,
      "title": "Event 1",
      "url": "javascript:void(0)",
      "class": "event-important",
      "start": 1422424903780, // Milliseconds
      "end": 1422434903780 // Milliseconds
    }
    ];},
  onAfterViewLoad: function(view) {
    $('.btn-group button').removeClass('active');
    $('button[calendarView="' + view + '"]').addClass('active');
    $('.page-header h3').text(this.getTitle());

    $('a[data-event-id]').click(function() {
      $('#eventFrame').text($(this).attr('data-event-id'));
    });
  }
});
function setViewLength(viewLength) {
  calendar.view(viewLength);
}
function navigate(where) {
  calendar.navigate(where);
}

//Angular code
var app = angular.module('calendarApp', []);
app.run(function($rootScope, $http) {
  $rootScope.things="text";
});
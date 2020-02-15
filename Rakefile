require 'rubygems'
require 'bundler/setup'
Bundler.require(:default, :development, :jekyll_plugins)
require 'jekyll'

HERE = File.expand_path("./")
TEST_CACHE = File.join(HERE, ".cache", "htmlproofer")

namespace :jekyll do
  def jekyll_site()
    # retrieve the jekyll site, with config
    options = Jekyll::Command.configuration_from_options(
      {:source => HERE}
    )
    return Jekyll::Site.new(options)
  end

  def run(serve=true)
    options = jekyll_site().config.merge({
      :watch => serve,
      :serving => serve,
    }).merge( serve ? {:url => 'http://localhost:4000'} : {} )
    Jekyll::Commands::Build.process(options)
    if serve
      Jekyll::Commands::Serve.process(options)
    end
  rescue
    nil
  end

  desc "Build the site out"
  task :build do
    run(serve=false)
  end

  task :serve do
    run()
  end
end


desc "Serve up the site (watching for changes)"
task :serve => "jekyll:serve"


desc "Check the site for linking issues"
task :test => "jekyll:build" do
  require 'html-proofer'

  options = {
  	:assume_extension => true,
  	:allow_hash_href => true,
  	:http_status_ignore => [999],  # because LinkedIn doesn't like being pinged
  	:check_html => true,
  	:check_img_http => true,
  	:check_opengraph => true,
    :parallel => {
      :in_processes => 3
    },
    :cache => {
      :storage_dir => TEST_CACHE,
      :timeframe => "30d",
    },
  }
  destination = jekyll_site().config["destination"]
  HTMLProofer.check_directory(destination, options).run
end

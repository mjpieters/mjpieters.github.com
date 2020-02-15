require 'rubygems'
require 'bundler/setup'
Bundler.require(:default, :development, :jekyll_plugins)
require 'jekyll'

HERE = Pathname("./").expand_path
TEST_CACHE = HERE / ".cache" / "htmlproofer"

module JekyllUtils
  @@_site = nil

  def site()
    # retrieve the jekyll site, with config

    @@_site ||= begin
      options = Jekyll::Command.configuration_from_options(
        {:source => HERE.to_s}
      )
      Jekyll::Site.new(options)
    end
    return @@_site
  end

  def run(serve=true)
    options = JekyllUtils::site().config.merge({
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

end

namespace :jekyll do
  desc "Build the site out"
  task :build do
    include JekyllUtils
    if outdated
      run(serve=false)
    end
  end

  task :serve do
    run
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
      :storage_dir => TEST_CACHE.to_s,
      :timeframe => "30d",
    },
  }
  destination = JekyllUtils::site().config["destination"]
  HTMLProofer.check_directory(destination, options).run
end
